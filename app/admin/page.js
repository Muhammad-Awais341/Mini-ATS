"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error || "Failed to create user");
    } else {
      toast.success("User created successfully!");
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Admin - Create User</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm border border-slate-300 px-3 py-1 rounded hover:bg-slate-50 transition"
          >
            Back
          </button>
        </div>

        <form onSubmit={createUser} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
            <select
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
}
