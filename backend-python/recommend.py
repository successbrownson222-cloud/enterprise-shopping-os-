# backend-python/recommend.py - Recommendation Engine ONLY
# No server here, just logic. Imported by ai.py
import random
from collections import Counter

# Fallback products if Node API is down (same shape as backend-node)
FALLBACK_PRODUCTS = [
    {"id":"TV1","name":"Samsung Smart TV","price":385000,"category":"TVs","brand":"Samsung","img":"📺","rating":4.8,"stock":14,"desc":"4K Ultra HD"},
    {"id":"TV2","name":"LG Smart TV","price":295000,"category":"TVs","brand":"LG","img":"📺","rating":4.7,"stock":9,"desc":"Full HD"},
    {"id":"TV3","name":"Hisense Smart TV","price":245000,"category":"TVs","brand":"Hisense","img":"📺","rating":4.6,"stock":18,"desc":"4K Bluetooth"},
    {"id":"FR1","name":"Hisense Chest Freezer","price":285000,"category":"Freezers","brand":"Hisense","img":"🧊","rating":4.8,"stock":11,"desc":"Fast freezing"},
    {"id":"FR2","name":"Thermocool Freezer","price":310000,"category":"Freezers","brand":"Thermocool","img":"🧊","rating":4.7,"stock":8,"desc":"Double door"},
    {"id":"GN1","name":"Firman Generator 5.5KVA","price":485000,"category":"Generators","brand":"Firman","img":"⚡","rating":4.8,"stock":7,"desc":"Key starter"},
    {"id":"CAR1","name":"Toyota Camry 2022","price":18500000,"category":"Cars","brand":"Toyota","img":"🚗","rating":4.9,"stock":3,"desc":"Full option"},
    {"id":"MS2","name":"Men Running Sneakers","price":38000,"category":"Men Shoes","brand":"Nike","img":"👟","rating":4.7,"stock":20,"desc":"Lightweight"},
]

def score_similarity(target, candidate):
    """Score 0-100 how similar candidate is to target"""
    if target["id"] == candidate["id"]:
        return -1
    score = 0
    if candidate.get("category") == target.get("category"):
        score += 50
    if candidate.get("brand") == target.get("brand"):
        score += 30
    # Price closeness: within 20% = +15, within 50% = +5
    tp, cp = target.get("price", 0), candidate.get("price", 0)
    if tp and cp:
        diff = abs(tp - cp) / tp
        if diff <= 0.2:
            score += 15
        elif diff <= 0.5:
            score += 5
    score += (candidate.get("rating", 0) * 2)  # up to +10
    return score

def get_similar_products(product_id, products, limit=4):
    """You viewed Samsung TV -> show LG, Hisense TVs"""
    target = next((p for p in products if p["id"] == product_id), None)
    if not target:
        return []
    scored = [(score_similarity(target, p), p) for p in products]
    scored = [(s, p) for s, p in scored if s >= 0]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in scored[:limit]]

def get_same_brand_products(brand, products, exclude_id=None, limit=4):
    """Same brand, different category: Samsung TV -> Samsung Freezer"""
    out = [p for p in products if p.get("brand") == brand and p["id"] != exclude_id]
    out.sort(key=lambda x: x.get("rating", 0), reverse=True)
    return out[:limit]

def get_trending(products, limit=6):
    """High rating + low stock = trending / hot"""
    sorted_p = sorted(products, key=lambda x: (x.get("rating", 0), -x.get("stock", 999)), reverse=True)
    return sorted_p[:limit]

def get_best_deals(products, limit=6):
    """Has oldPrice and big discount"""
    deals = []
    for p in products:
        if p.get("oldPrice") and p.get("oldPrice") > p.get("price", 0):
            discount = (p["oldPrice"] - p["price"]) / p["oldPrice"] * 100
            deals.append((discount, p))
    deals.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in deals[:limit]]

def get_for_cart(cart_items, products, limit=4):
    """Cart has TV -> suggest Freezer, Generator. Cart has Shoes -> suggest Clothes"""
    if not cart_items:
        return get_trending(products, limit)
    # Complementary mapping
    COMPLEMENT = {
        "TVs": ["Freezers", "Home Appliances", "Generators"],
        "Freezers": ["TVs", "Home Appliances", "Generators"],
        "Generators": ["TVs", "Freezers", "Home Appliances"],
        "Men Shoes": ["Men Clothes", "Women Shoes"],
        "Women Shoes": ["Women Clothes", "Men Shoes"],
        "Men Clothes": ["Men Shoes"],
        "Women Clothes": ["Women Shoes"],
        "Cars": ["Home Appliances", "Generators"],
        "Kitchen Utensils": ["Home Appliances", "Freezers"],
    }
    cart_cats = [it.get("category") for it in cart_items]
    cart_brands = [it.get("brand") for it in cart_items]
    cart_ids = [it.get("id") for it in cart_items]

    suggestions = []
    # 1. Same brand first
    for b in cart_brands:
        for p in get_same_brand_products(b, products, limit=2):
            if p["id"] not in cart_ids and p not in suggestions:
                suggestions.append(p)
    # 2. Complementary category
    want_cats = []
    for c in cart_cats:
        want_cats.extend(COMPLEMENT.get(c, []))
    for cat in want_cats:
        for p in products:
            if p.get("category") == cat and p["id"] not in cart_ids and p not in suggestions:
                suggestions.append(p)
            if len(suggestions) >= limit:
                break
        if len(suggestions) >= limit:
            break
    return suggestions[:limit]

def get_personalized(user_history, products, limit=6):
    """user_history = list of product_ids viewed/bought. Recommend same category/brand"""
    if not user_history:
        return get_trending(products, limit)
    viewed = [p for p in products if p["id"] in user_history]
    if not viewed:
        return get_trending(products, limit)
    # Most viewed category + brand
    cats = Counter([p.get("category") for p in viewed])
    brands = Counter([p.get("brand") for p in viewed])
    top_cat = cats.most_common(1)[0][0]
    top_brand = brands.most_common(1)[0][0]

    out = []
    for p in products:
        if p["id"] in user_history:
            continue
        if p.get("category") == top_cat or p.get("brand") == top_brand:
            out.append(p)
    out.sort(key=lambda x: x.get("rating", 0), reverse=True)
    if len(out) < limit:
        for p in get_trending(products, limit):
            if p not in out and p["id"] not in user_history:
                out.append(p)
    return out[:limit]

def search_products(query, products):
    """Smart search: 'samsung tv under 300k'"""
    q = query.lower()
    out = []
    for p in products:
        text = (p.get("name","") + " " + p.get("category","") + " " + p.get("brand","")).lower()
        if any(word in text for word in q.split() if len(word) > 2):
            out.append(p)
    return out 