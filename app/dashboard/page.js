"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardData } from "./useDashboardData";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useSWRConfig } from "swr";

export default function DashboardPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const { data, isLoading, isError } = useDashboardData(supabase);
  const { mutate } = useSWRConfig();

  const logout = async () => {
    await supabase.auth.signOut();
    
    // Clear SWR cache to prevent data leakage between users
    mutate(() => true, undefined, { revalidate: false });
    
    router.push("/login");
  };

  if (isLoading || !supabase) {
    return <div>Loading...</div>;
  }

  if (isError) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-6xl mx-auto bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-2 text-lg">Overview of your recruitment activity</p>
          </div>

          <button
            className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow transition-all font-medium"
            onClick={logout}
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Signed in as</p>
            <p className="text-xl font-bold text-slate-800 truncate">{data.email}</p>
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-100">
              Role: <span className="ml-1 capitalize">{data.role || "Loading..."}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-6 text-center text-white shadow-lg hover:-translate-y-1 transition-transform duration-300">
              <p className="text-indigo-100 font-medium">Active Jobs</p>
              <p className="text-5xl font-extrabold mt-3">{data.jobsCount}</p>
            </div>
            <div className="bg-gradient-to-br from-violet-600 to-pink-500 rounded-2xl p-6 text-center text-white shadow-lg hover:-translate-y-1 transition-transform duration-300">
              <p className="text-violet-100 font-medium">Candidates</p>
              <p className="text-5xl font-extrabold mt-3">{data.candidatesCount}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
          <button
            className="bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-semibold"
            onClick={() => router.push("/jobs")}
          >
            Manage Jobs
          </button>

          <button
            className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-50 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all font-semibold"
            onClick={() => router.push("/kanban")}
          >
            Candidate Kanban
          </button>

          {data.role === "admin" && (
            <button
              className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-6 py-3 rounded-xl hover:bg-indigo-100 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all font-semibold"
              onClick={() => router.push("/admin")}
            >
              Admin Panel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
