"use client";

import { useState } from "react";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [msg, setMsg] = useState("");

  const createUser = async (e) => {
    e.preventDefault();
    setMsg("");

    const res = await fetch("/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg(data.error);
    } else {
      setMsg("User created successfully ✅");
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin - Create User</h1>

      <form onSubmit={createUser} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border p-2 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <select
          className="w-full border p-2 rounded"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>

        <button className="w-full bg-black text-white py-2 rounded">
          Create User
        </button>
      </form>

      {msg && <p className="mt-4 text-red-600">{msg}</p>}
    </div>
  );
}
