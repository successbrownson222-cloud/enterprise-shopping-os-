<?php
// backend-php/invoice.php - Invoice / Receipt Generator
// Usage: GET /invoice.php?orderId=ORD-123
//        POST /invoice.php  { order: {...}, customer: {...}, items: [...] }
// Returns: HTML invoice (printable) + JSON if ?format=json
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$orderId = $_GET['orderId'] ?? $body['orderId'] ?? $body['order']['id'] ?? 'ORD-'.time();
$order = $body['order'] ?? $body ?? [];
$items = $order['items'] ?? $body['items'] ?? [];
$customer = $order['customer'] ?? $body['customer'] ?? ['name'=>'Customer','email'=>'','phone'=>''];
$total = $order['total'] ?? $body['total'] ?? 0;
$address = $order['address'] ?? $body['address'] ?? '';
$gateway = $order['gateway'] ?? $body['gateway'] ?? 'Pay on Delivery';
$status = $order['status'] ?? $body['status'] ?? 'Ordered';
$createdAt = $order['createdAt'] ?? date('Y-m-d H:i:s');
$reference = $body['reference'] ?? $body['tx_ref'] ?? '';

// If no items passed, try to fetch from Node (optional)
if (empty($items) && isset($_GET['orderId'])) {
    // Frontend should POST full order. This is fallback.
    $items = [];
}

// Calculate totals
$subtotal = 0;
foreach ($items as $it) {
    $subtotal += ($it['price'] ?? 0) * ($it['qty'] ?? 1);
}
$delivery = max(0, $total - $subtotal);
if ($total == 0) $total = $subtotal;

if (($_GET['format'] ?? '') === 'json') {
    header("Content-Type: application/json");
    echo json_encode(['orderId'=>$orderId, 'customer'=>$customer, 'items'=>$items, 'subtotal'=>$subtotal, 'delivery'=>$delivery, 'total'=>$total, 'gateway'=>$gateway, 'status'=>$status, 'createdAt'=>$createdAt, 'address'=>$address]);
    exit;
}

// ---------- HTML INVOICE (Printable) ----------
?>
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice <?= htmlspecialchars($orderId) ?> - SwiftMart</title>
<style>
  *{font-family:Arial,sans-serif} body{max-width:700px;margin:20px auto;padding:20px;color:#111}
  .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #f59e0b;padding-bottom:12px}
  .logo{font-size:28px;font-weight:900}.logo span{color:#f59e0b}
  .badge{background:#f59e0b;color:#000;padding:6px 14px;border-radius:999px;font-weight:800;font-size:12px}
  .box{display:flex;gap:20px;margin:20px 0}.box div{flex:1;background:#f8fafc;padding:14px;border-radius:12px}
  table{width:100%;border-collapse:collapse} th{background:#0f172a;color:#fff;padding:10px;text-align:left;font-size:13px} td{padding:10px;border-bottom:1px solid #eee;font-size:13px}
  .totals{margin-left:auto;width:300px;margin-top:16px}.totals div{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}
  .totals .grand{font-weight:900;font-size:18px;border-top:2px solid #111;padding-top:10px}
  .footer{margin-top:30px;text-align:center;color:#888;font-size:12px}
  @media print{.no-print{display:none}}
</style></head><body>
  <div class="header"><div class="logo">🛒 Swift<span>Mart</span><div style="font-size:12px;color:#666;font-weight:400">Lagos, Nigeria • support@swiftmart.com</div></div><div><span class="badge">INVOICE</span><div style="text-align:right;margin-top:8px;font-size:13px"><b><?= htmlspecialchars($orderId) ?></b><br><?= htmlspecialchars($createdAt) ?></div></div></div>

  <div class="box">
    <div><b>Bill To</b><br><?= htmlspecialchars($customer['name'] ?? 'Customer') ?><br><?= htmlspecialchars($customer['email'] ?? '') ?><br><?= htmlspecialchars($customer['phone'] ?? '') ?><br><?= htmlspecialchars($address) ?></div>
    <div><b>Payment</b><br>Gateway: <?= htmlspecialchars($gateway) ?><br>Status: <b><?= htmlspecialchars($status) ?></b><br><?= $reference ? 'Ref: '.htmlspecialchars($reference).'<br>' : '' ?>Delivery: Lagos / Nationwide</div>
  </div>

  <table><tr><th>#</th><th>Product</th><th>Brand / Size / Color</th><th>Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr>
  <?php $i=1; foreach($items as $it): $line=($it['price']??0)*($it['qty']??1); ?>
    <tr>
      <td><?= $i++ ?></td>
      <td><b><?= htmlspecialchars($it['name'] ?? 'Product') ?></b><br><span style="color:#888"><?= htmlspecialchars($it['img'] ?? '') ?></span></td>
      <td><?= htmlspecialchars(($it['brand']??'').' / '.($it['size']??'').' / '.($it['color']??'')) ?></td>
      <td><?= $it['qty'] ?? 1 ?></td>
      <td style="text-align:right">₦<?= number_format($it['price'] ?? 0) ?></td>
      <td style="text-align:right"><b>₦<?= number_format($line) ?></b></td>
    </tr>
  <?php endforeach; ?>
  <?php if(empty($items)): ?><tr><td colspan="6" style="text-align:center;color:#888">No items - invoice generated from order ID only</td></tr><?php endif; ?>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>₦<?= number_format($subtotal) ?></span></div>
    <div><span>Delivery</span><span>₦<?= number_format($delivery) ?></span></div>
    <div class="grand"><span>TOTAL</span><span>₦<?= number_format($total) ?></span></div>
  </div>

  <div class="footer">
    <p>Thank you for shopping with SwiftMart! 🙏<br>1 Year Warranty on TVs, Freezers & Generators • 7-Day Return if faulty</p>
    <button class="no-print" onclick="window.print()" style="background:#f59e0b;border:0;padding:12px 24px;border-radius:999px;font-weight:800;cursor:pointer">🖨️ Print / Save PDF</button>
  </div>
</body></html> 