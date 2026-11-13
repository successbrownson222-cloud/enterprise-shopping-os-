"use client";
import { useState } from "react";
export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  return (
    <main className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 text-black">
        <h1 className="text-2xl font-black text-center">{mode === "login" ? "Welcome Back" : "Create Account"}</h1>
        <p className="text-center text-slate-500 text-sm mb-6">SwiftMart • {mode === "login" ? "Sign in to checkout" : "Join to checkout"}</p>
        <div className="flex bg-slate-100 rounded-full p-1 mb-4">
          <button onClick={() => setMode("login")} className={`flex-1 py-2 rounded-full text-sm font-bold ${mode === "login" ? "bg-black text-white" : ""}`}>Sign In</button>
          <button onClick={() => setMode("signup")} className={`flex-1 py-2 rounded-full text-sm font-bold ${mode === "signup" ? "bg-black text-white" : ""}`}>Sign Up</button>
        </div>
        {mode === "signup" && <input placeholder="Full Name" className="w-full border rounded-xl px-4 py-3 mb-3 outline-none" />}
        <input placeholder="Email" className="w-full border rounded-xl px-4 py-3 mb-3 outline-none" />
        <input placeholder="Password" type="password" className="w-full border rounded-xl px-4 py-3 mb-4 outline-none" />
        <button className="w-full bg-amber-400 py-3 rounded-xl font-black">{mode === "login" ? "Sign In" : "Create Account"}</button>
        <a href="/" className="block text-center text-sm mt-4 text-slate-500">← Back to Shop</a>
      </div>
    </main>
  );
}