"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function ManagerPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("candidate");
  const [loading, setLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const r = profile?.role;
      // Only admin and manager can access this page
      if (r !== "admin" && r !== "manager") {
        router.push("/dashboard");
        return;
      }
      setCurrentUserRole(r);
    };
    fetchRole();
  }, [supabase, router]);

  const createUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role, name }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error || "Failed to create account");
    } else {
      toast.success("Candidate account created successfully!");
      setEmail("");
      setPassword("");
      setName("");
      setRole("candidate");
    }
  };

  if (!currentUserRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500 text-sm">Verifying access...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {currentUserRole === "admin" ? "Super Admin" : "Manager"} Panel
          </span>
        </div>

        {/* Card */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />

          <div className="p-8">
            {/* Title */}
            <div className="mb-7">
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {currentUserRole === "admin" ? "Super Admin Panel" : "Manager Panel"}
              </h1>
              <p className="text-slate-500 mt-1 text-sm leading-relaxed">
                Create a new candidate account. The candidate will use these credentials to log in and view their application status.
              </p>
            </div>

            {/* Info callout */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex gap-3">
              <svg className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-indigo-700 leading-relaxed">
                This creates a <strong>login account</strong> for the candidate. To add a candidate to a job&apos;s pipeline without an account, use the <strong>Kanban board</strong>.
              </p>
            </div>

            <form onSubmit={createUser} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  className="w-full border border-slate-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Candidate Email
                </label>
                <input
                  className="w-full border border-slate-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  placeholder="candidate@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Temporary Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Temporary Password
                </label>
                <input
                  className="w-full border border-slate-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Share this with the candidate. They can change it after first login.
                </p>
              </div>

              {/* Role — only root admin sees the manager option */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Account Role
                </label>
                <select
                  className="w-full border border-slate-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="candidate">Candidate — can view their application status</option>
                  {currentUserRole === "admin" && (
                    <option value="manager">Manager (HR) — can manage all jobs &amp; pipelines</option>
                  )}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
