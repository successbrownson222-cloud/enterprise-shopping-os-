// frontend/lib/auth.ts - Auth helpers + validation. No UI here.

export type AuthUser = { id: string; name: string; email: string; role: "admin" | "customer"; phone?: string };

const KEY_TOKEN = "swiftmart_token";
const KEY_USER = "swiftmart_user";

export function saveAuth(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_TOKEN, token);
  localStorage.setItem(KEY_USER, JSON.stringify(user));
}
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY_TOKEN);
}
export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY_USER) || "null"); } catch { return null; }
}
export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_USER);
}
export function isLoggedIn() { return !!getToken(); }
export function isAdmin() { return getUser()?.role === "admin"; }
export function authHeaders() {
  const t = getToken();
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

// ---------- STRONG VALIDATION ----------
export function validateName(name: string): string | null {
  if (!name.trim()) return "Full name is required";
  if (name.trim().length < 3) return "Name must be at least 3 characters";
  if (!/^[a-zA-Z\s'-]+$/.test(name)) return "Name must contain only letters";
  return null;
}
export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Enter a valid email e.g. you@gmail.com";
  return null;
}
export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "Phone is required";
  const clean = phone.replace(/[\s-]/g, "");
  if (!/^(\+234|0)(70|80|81|90|91)\d{8}$/.test(clean)) return "Enter valid Nigerian number e.g. 08012345678";
  return null;
}
export function validatePassword(pw: string): string[] {
  const errs: string[] = [];
  if (pw.length < 8) errs.push("At least 8 characters");
  if (!/[A-Z]/.test(pw)) errs.push("One uppercase letter (A-Z)");
  if (!/[a-z]/.test(pw)) errs.push("One lowercase letter (a-z)");
  if (!/[0-9]/.test(pw)) errs.push("One number (0-9)");
  if (!/[^A-Za-z0-9]/.test(pw)) errs.push("One symbol (!@#$%)");
  return errs;
}
export function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 2) return { score: s, label: "Weak", color: "#ef4444" };
  if (s === 3) return { score: s, label: "Fair", color: "#f59e0b" };
  if (s === 4) return { score: s, label: "Good", color: "#22c55e" };
  return { score: s, label: "Strong", color: "#16a34a" };
}