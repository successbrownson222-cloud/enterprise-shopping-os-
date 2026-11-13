export default function SignIn() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-slate-950">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-center mb-1">Welcome Back</h1>
        <p className="text-center text-slate-500 text-sm mb-6">Sign in to SwiftMart</p>
        <input placeholder="Email" className="w-full border rounded-xl px-4 py-3 mb-3 outline-none" />
        <input placeholder="Password" type="password" className="w-full border rounded-xl px-4 py-3 mb-4 outline-none" />
        <button className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-3 rounded-xl">Sign In</button>
        <p className="text-center text-sm mt-4">No account? <a href="/signup" className="text-amber-600 font-bold">Sign Up</a></p>
      </div>
    </main>
  );
}