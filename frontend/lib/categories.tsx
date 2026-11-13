export const CATEGORIES = [
  "All", "Men Shoes", "Women Shoes", "Men Clothes", "Women Clothes",
  "Children Clothes", "Children Shoes", "Cars", "TVs", "Freezers",
  "Kitchen Utensils", "Generators", "Home Appliances"
];

export const BRANDS_BY_CATEGORY: Record<string, string[]> = {
  "Men Shoes": ["Nike", "Adidas", "Clarks", "New Balance", "Puma"],
  "Women Shoes": ["Nike", "Adidas", "Steve Madden", "Clarks", "Zara"],
  "Men Clothes": ["Nike", "Zara", "H&M", "Polo", "Senator"],
  "Women Clothes": ["Zara", "H&M", "Ankara", "Shein", "Boutique"],
  "Children Clothes": ["Zara Kids", "H&M Kids", "Mothercare", "Local"],
  "Children Shoes": ["Nike Kids", "Adidas Kids", "Crocs", "Clarks Kids"],
  "Cars": ["Toyota", "Lexus", "Honda", "Mercedes", "Hyundai", "Kia"],
  "TVs": ["Samsung", "LG", "Hisense", "Sony", "TCL"],
  "Freezers": ["Hisense", "LG", "Thermocool", "Samsung", "Haier"],
  "Kitchen Utensils": ["Master Chef", "Non-Stick Pro", "Stainless Steel", "Tefal"],
  "Generators": ["Firman", "Tiger", "Elepaq", "Sumec", "Honda"],
  "Home Appliances": ["LG", "Samsung", "Hisense", "Binatone", "Scanfrost"],
};

// ✅ URLs - 1 place only, no hardcoding in components
export const API_URL = (process.env as any).NEXT_PUBLIC_SHOP_API_URL || "https://swiftmart-node.onrender.com/";
export const PHP_URL = (process.env as any).NEXT_PUBLIC_PHP_API_URL || "https://swiftmart-php.onrender.com/";
export const PYTHON_URL = (process.env as any).NEXT_PUBLIC_AI_API_URL || "https://swiftmart-python.onrender.com/";

export type Product = {
  id: string; name: string; price: number; oldPrice?: number; category: string;
  brand: string; img: string; rating: number; stock: number; desc: string;
  sizes: string[]; colors: string[]; colorHex: Record<string, string>;
};
