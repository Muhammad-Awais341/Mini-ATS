"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onRegister = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (user) {
      await supabase.from("profiles").insert({
        id: user.id,
        role,
      });
    }

    setLoading(false);
    router.push("/login");
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Register</h1>

      <form onSubmit={onRegister} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <select
          className="w-full border p-2 rounded"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>

        <button className="w-full bg-black text-white p-2 rounded" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>

        {msg && <p className="text-red-600">{msg}</p>}
      </form>

      <p className="mt-4 text-center">
        Already have an account?{" "}
        <button
          onClick={() => router.push("/login")}
          className="text-blue-600 hover:underline"
        >
          Login here
        </button>
      </p>
    </div>
  );
}
