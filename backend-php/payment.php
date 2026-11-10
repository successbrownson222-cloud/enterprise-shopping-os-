<?php
// backend-php/payments.php - Paystack + Flutterwave ONLY
// Run: php -S localhost:8001
// Env: PAYSTACK_SECRET, PAYSTACK_PUBLIC, FLW_SECRET, FLW_PUBLIC
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

// ---------- CONFIG - Put keys in Render Env, not in code ----------
$PAYSTACK_SECRET = getenv('PAYSTACK_SECRET') ?: 'sk_test_XXXXXXXXXXXXXXXX';
$PAYSTACK_PUBLIC = getenv('PAYSTACK_PUBLIC') ?: 'pk_test_XXXXXXXXXXXXXXXX';
$FLW_SECRET      = getenv('FLW_SECRET') ?: 'FLWSECK_TEST-XXXXXXXXXXXXXXXX-X';
$FLW_PUBLIC      = getenv('FLW_PUBLIC') ?: 'FLWPUBK_TEST-XXXXXXXXXXXXXXXX-X';
$NODE_API        = getenv('NODE_API') ?: 'https://swiftmart-node.onrender.com';
$FRONTEND_URL    = getenv('FRONTEND_URL') ?: 'https://swiftmart-frontend.vercel.app';

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$action = $_GET['action'] ?? $body['action'] ?? '';

// ---------- HELPERS ----------
function callApi($url, $secret, $payload = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $secret", "Content-Type: application/json"]);
    if ($payload) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    }
    $res = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    if ($err) return ['error' => $err];
    return json_decode($res, true);
}

function updateNodeOrder($orderId, $status) {
    global $NODE_API;
    // Node needs admin token - for now we just log. Frontend will call Node to update.
    // If you have ADMIN_TOKEN env, uncomment below:
    // $token = getenv('ADMIN_TOKEN');
    // $ch = curl_init("$NODE_API/api/orders/$orderId/status");
    // curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
    // curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['status'=>$status]));
    // curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json", "Authorization: Bearer $token"]);
    // curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    // curl_exec($ch); curl_close($ch);
    return true;
}

// ---------- 1. INIT PAYSTACK ----------
if ($action === 'init-paystack') {
    // Input: { email, amount (naira), orderId, customerName, phone }
    $email = $body['email'] ?? '';
    $amountNaira = floatval($body['amount'] ?? 0);
    $orderId = $body['orderId'] ?? 'ORD-'.time();
    if (!$email || $amountNaira <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'email + amount required']); exit;
    }
    $res = callApi("https://api.paystack.co/transaction/initialize", $PAYSTACK_SECRET, [
        'email' => $email,
        'amount' => (int)($amountNaira * 100), // Paystack uses kobo
        'reference' => $orderId . '-' . time(),
        'callback_url' => "$FRONTEND_URL/checkout/success?orderId=$orderId&gateway=paystack",
        'metadata' => [
            'orderId' => $orderId,
            'customerName' => $body['customerName'] ?? '',
            'phone' => $body['phone'] ?? '',
            'items' => $body['items'] ?? []
        ]
    ]);
    if (empty($res['data']['authorization_url'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Paystack init failed', 'detail' => $res]); exit;
    }
    echo json_encode([
        'gateway' => 'paystack',
        'authorization_url' => $res['data']['authorization_url'],
        'access_code' => $res['data']['access_code'],
        'reference' => $res['data']['reference'],
        'orderId' => $orderId,
        'publicKey' => $PAYSTACK_PUBLIC
    ]);
    exit;
}

// ---------- 2. VERIFY PAYSTACK ----------
if ($action === 'verify-paystack') {
    $reference = $_GET['reference'] ?? $body['reference'] ?? '';
    if (!$reference) { http_response_code(400); echo json_encode(['error'=>'reference required']); exit; }
    $res = callApi("https://api.paystack.co/transaction/verify/$reference", $PAYSTACK_SECRET);
    $data = $res['data'] ?? null;
    if ($data && $data['status'] === 'success') {
        $orderId = $data['metadata']['orderId'] ?? '';
        updateNodeOrder($orderId, 'Paid');
        echo json_encode(['success'=>true, 'gateway'=>'paystack', 'reference'=>$reference, 'amount'=>($data['amount']/100), 'email'=>$data['customer']['email'], 'orderId'=>$orderId, 'paidAt'=>$data['paid_at']]);
    } else {
        echo json_encode(['success'=>false, 'gateway'=>'paystack', 'detail'=>$res]);
    }
    exit;
}

// ---------- 3. INIT FLUTTERWAVE ----------
if ($action === 'init-flutterwave') {
    $email = $body['email'] ?? '';
    $amount = floatval($body['amount'] ?? 0);
    $orderId = $body['orderId'] ?? 'ORD-'.time();
    $name = $body['customerName'] ?? 'SwiftMart Customer';
    if (!$email || $amount <= 0) { http_response_code(400); echo json_encode(['error'=>'email + amount required']); exit; }
    $txRef = $orderId . '-' . time();
    $res = callApi("https://api.flutterwave.com/v3/payments", $FLW_SECRET, [
        'tx_ref' => $txRef,
        'amount' => $amount,
        'currency' => 'NGN',
        'redirect_url' => "$FRONTEND_URL/checkout/success?orderId=$orderId&gateway=flutterwave&tx_ref=$txRef",
        'customer' => ['email'=>$email, 'name'=>$name, 'phonenumber'=>$body['phone'] ?? ''],
        'customizations' => ['title'=>'SwiftMart', 'description'=>'SwiftMart Order '.$orderId, 'logo'=>'https://swiftmart-frontend.vercel.app/logo.png'],
        'meta' => ['orderId'=>$orderId, 'items'=> $body['items'] ?? []]
    ]);
    if (empty($res['data']['link'])) { http_response_code(400); echo json_encode(['error'=>'Flutterwave init failed','detail'=>$res]); exit; }
    echo json_encode(['gateway'=>'flutterwave', 'payment_link'=>$res['data']['link'], 'authorization_url'=>$res['data']['link'], 'tx_ref'=>$txRef, 'orderId'=>$orderId, 'publicKey'=>$FLW_PUBLIC]);
    exit;
}

// ---------- 4. VERIFY FLUTTERWAVE ----------
if ($action === 'verify-flutterwave') {
    $txRef = $_GET['tx_ref'] ?? $body['tx_ref'] ?? $_GET['transaction_id'] ?? $body['transaction_id'] ?? '';
    if (!$txRef) { http_response_code(400); echo json_encode(['error'=>'tx_ref / transaction_id required']); exit; }
    // If transaction_id given, verify by id, else by tx_ref via transaction lookup
    if (isset($_GET['transaction_id']) || isset($body['transaction_id'])) {
        $res = callApi("https://api.flutterwave.com/v3/transactions/$txRef/verify", $FLW_SECRET);
    } else {
        // Search by tx_ref - Flutterwave verify needs transaction_id, so we try verify endpoint with tx_ref fallback
        $res = callApi("https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=$txRef", $FLW_SECRET);
    }
    $data = $res['data'] ?? null;
    if ($data && ($data['status'] === 'successful' || $data['status'] === 'success')) {
        $orderId = $data['meta']['orderId'] ?? $data['tx_ref'] ?? '';
        updateNodeOrder($orderId, 'Paid');
        echo json_encode(['success'=>true, 'gateway'=>'flutterwave', 'tx_ref'=>$data['tx_ref'] ?? $txRef, 'amount'=>$data['amount'] ?? null, 'email'=>$data['customer']['email'] ?? '', 'orderId'=>$orderId]);
    } else {
        echo json_encode(['success'=>false, 'gateway'=>'flutterwave', 'detail'=>$res]);
    }
    exit;
}

// ---------- 5. PAYSTACK WEBHOOK (auto-confirm) ----------
if ($action === 'webhook-paystack') {
    $payload = file_get_contents('php://input');
    $sig = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? '';
    $expected = hash_hmac('sha512', $payload, $PAYSTACK_SECRET);
    if ($sig !== $expected) { http_response_code(401); echo json_encode(['error'=>'Invalid signature']); exit; }
    $event = json_decode($payload, true);
    if (($event['event'] ?? '') === 'charge.success') {
        $orderId = $event['data']['metadata']['orderId'] ?? '';
        updateNodeOrder($orderId, 'Paid');
    }
    echo json_encode(['ok'=>true]); exit;
}

// ---------- 6. FLUTTERWAVE WEBHOOK ----------
if ($action === 'webhook-flutterwave') {
    $payload = file_get_contents('php://input');
    $sig = $_SERVER['HTTP_VERIF_HASH'] ?? '';
    $secretHash = getenv('FLW_SECRET_HASH') ?: 'swiftmart-flw-hash';
    if ($sig !== $secretHash) { http_response_code(401); echo json_encode(['error'=>'Invalid hash']); exit; }
    $event = json_decode($payload, true);
    if (($event['event'] ?? '') === 'charge.completed' && ($event['data']['status'] ?? '') === 'successful') {
        $orderId = $event['data']['meta']['orderId'] ?? '';
        updateNodeOrder($orderId, 'Paid');
    }
    echo json_encode(['ok'=>true]); exit;
}

// ---------- 7. CONFIG - Frontend asks which gateways are enabled ----------
if ($action === 'config' || $action === '') {
    echo json_encode([
        'paystack' => ['enabled'=>true, 'publicKey'=>$PAYSTACK_PUBLIC],
        'flutterwave' => ['enabled'=>true, 'publicKey'=>$FLW_PUBLIC],
        'currency' => 'NGN'
    ]);
    exit;
}

http_response_code(404);
echo json_encode(['error'=>'Unknown action. Use ?action=init-paystack | verify-paystack | init-flutterwave | verify-flutterwave | config']); 