# backend-python/ai.py - AI Chat + Recommend API Server
# Run: pip install flask flask-cors requests
#      python ai.py  -> runs on http://localhost:8000
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import re
import os

from recommend import (
    FALLBACK_PRODUCTS,
    get_similar_products,
    get_same_brand_products,
    get_trending,
    get_best_deals,
    get_for_cart,
    get_personalized,
    search_products,
)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

NODE_API = os.environ.get("NODE_API", "https://swiftmart-node.onrender.com")
# For local: NODE_API=http://localhost:5000

def fetch_products():
    """Get live products from Node backend. Fallback if down."""
    try:
        r = requests.get(f"{NODE_API}/api/products", timeout=5)
        data = r.json()
        products = data.get("data", []) if isinstance(data, dict) else data
        if products:
            return products
    except Exception as e:
        print("Node fetch failed, using fallback:", e)
    return FALLBACK_PRODUCTS

# ---------- HEALTH ----------
@app.route("/health", methods=["GET"])
def health():
    products = fetch_products()
    return jsonify({"status": "SwiftMart Python AI running", "products": len(products)})

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "SwiftMart AI - use /api/ai/chat, /api/recommend/similar, /api/recommend/trending"})

# ---------- RECOMMEND ENDPOINTS ----------
@app.route("/api/recommend/similar/<product_id>", methods=["GET"])
def similar(product_id):
    products = fetch_products()
    limit = int(request.args.get("limit", 4))
    return jsonify({"data": get_similar_products(product_id, products, limit)})

@app.route("/api/recommend/brand/<brand>", methods=["GET"])
def by_brand(brand):
    products = fetch_products()
    limit = int(request.args.get("limit", 4))
    return jsonify({"data": get_same_brand_products(brand, products, limit=limit)})

@app.route("/api/recommend/trending", methods=["GET"])
def trending():
    products = fetch_products()
    limit = int(request.args.get("limit", 6))
    return jsonify({"data": get_trending(products, limit)})

@app.route("/api/recommend/deals", methods=["GET"])
def deals():
    products = fetch_products()
    limit = int(request.args.get("limit", 6))
    return jsonify({"data": get_best_deals(products, limit)})

@app.route("/api/recommend/cart", methods=["POST"])
def for_cart():
    body = request.get_json() or {}
    cart = body.get("cart", [])
    products = fetch_products()
    limit = int(body.get("limit", 4))
    return jsonify({"data": get_for_cart(cart, products, limit)})

@app.route("/api/recommend/personalized", methods=["POST"])
def personalized():
    body = request.get_json() or {}
    history = body.get("history", [])  # list of product ids viewed
    products = fetch_products()
    limit = int(body.get("limit", 6))
    return jsonify({"data": get_personalized(history, products, limit)})

# ---------- AI CHAT ----------
@app.route("/api/ai/chat", methods=["POST"])
def ai_chat():
    body = request.get_json() or {}
    message = (body.get("message") or "").strip()
    cart = body.get("cart", [])
    history = body.get("history", [])
    products = fetch_products()

    if not message:
        return jsonify({"reply": "Hi! 👋 What are you looking for? TV, Freezer, Shoes, Car, Generator?", "products": []})

    msg = message.lower()
    reply = ""
    found = []

    # 1. GREETING
    if any(w in msg for w in ["hi", "hello", "hey", "good morning", "good evening"]):
        reply = "Hi! 👋 Welcome to SwiftMart. What do you want today? I can find Samsung TVs, Hisense Freezers, Nike Shoes, Toyota Cars, Firman Generators..."

    # 2. PRICE / BUDGET: "tv under 300k", "freezer under 300000"
    elif "under" in msg or "below" in msg or "budget" in msg:
        numbers = re.findall(r"\d+", msg.replace(",", "").replace("k", "000"))
        budget = int(numbers[0]) if numbers else 0
        if budget and budget < 1000:  # user said 300k
            budget = budget * 1000
        cat = None
        for c in ["tv", "freezer", "generator", "shoe", "car", "cloth"]:
            if c in msg:
                cat = c
                break
        found = [p for p in products if p["price"] <= budget]
        if cat:
            found = [p for p in found if cat in (p.get("category","") + p.get("name","")).lower()]
        found.sort(key=lambda x: x["price"])
        if found:
            reply = f"Here are options under ₦{budget:,} I found for you:"
        else:
            reply = f"No product under ₦{budget:,} yet. Try a higher budget or check our Best Deals."
            found = get_best_deals(products, 4)

    # 3. BRAND SEARCH: "samsung tv", "hisense freezer", "nike shoes"
    elif any(b in msg for b in ["samsung", "lg", "hisense", "nike", "adidas", "toyota", "lexus", "firman", "tiger", "thermocool", "clarks"]):
        found = search_products(message, products)[:6]
        if found:
            reply = f"Found {len(found)} for '{message}':"
        else:
            reply = "I didn't find that brand. Try Samsung, LG, Hisense, Nike, Toyota, Firman."

    # 4. CATEGORY SEARCH: "show me tvs", "i want freezer"
    elif any(c in msg for c in ["tv", "television", "freezer", "generator", "shoe", "cloth", "car", "kitchen", "fan"]):
        found = search_products(message, products)[:6]
        if found:
            reply = f"Here are the best {message} options:"
        else:
            reply = "Tell me which category: TVs, Freezers, Generators, Shoes, Clothes, Cars?"

    # 5. CART SUGGESTION: "what should i add", "complete my order"
    elif any(w in msg for w in ["add", "complete", "suggest", "also", "recommend"]):
        found = get_for_cart(cart, products, 4)
        reply = "Based on your cart, you may also like:"

    # 6. DEALS
    elif any(w in msg for w in ["deal", "discount", "cheap", "sale", "offer", "promo"]):
        found = get_best_deals(products, 6)
        reply = "🔥 Best deals today:"

    # 7. DELIVERY / PAYMENT
    elif any(w in msg for w in ["delivery", "deliver", "shipping"]):
        reply = "We deliver to Lagos same-day, Abuja / Port Harcourt 2-3 days. Delivery fee depends on location. You can pay on delivery or transfer. Want me to find a product first?"
    elif any(w in msg for w in ["pay", "payment", "transfer", "cash"]):
        reply = "You can pay with Transfer, Card, or Cash on Delivery. Checkout is safe. Which product do you want to buy?"
    elif any(w in msg for w in ["warranty", "guarantee", "return"]):
        reply = "All TVs, Freezers, Generators have 1 year warranty. You can return within 7 days if faulty. Want to see a product?"

    # 8. FALLBACK: smart search
    else:
        found = search_products(message, products)[:6]
        if found:
            reply = f"I found these for '{message}':"
        else:
            # Personalized fallback
            found = get_personalized(history, products, 4)
            reply = "I'm not sure, but you may like these trending products:"

    return jsonify({"reply": reply, "products": found})

# ---------- RUN ----------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"✅ SwiftMart Python AI on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True) 