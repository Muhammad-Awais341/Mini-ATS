"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function RegisterPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (user) {
      await supabase.from("profiles").insert({
        id: user.id,
        role: "customer",
      });
    }

    setLoading(false);
    toast.success("Registration successful!");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-6 text-center tracking-tight">Create Account</h1>

        <form onSubmit={onRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              className="w-full border border-slate-200 bg-white/50 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              className="w-full border border-slate-200 bg-white/50 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold p-3 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200" 
            disabled={loading}
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-purple-600 font-semibold hover:text-purple-700 hover:underline transition-colors"
          >
            Log in here
          </button>
        </p>
      </div>
    </div>
  );
}
