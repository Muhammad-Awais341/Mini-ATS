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
    <div className="p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500 mt-1">Overview of your recruitment activity</p>
          </div>

          <button
            className="border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition"
            onClick={logout}
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          <div className="border border-slate-200 rounded-xl p-6">
            <p className="text-sm text-slate-500">Signed in as</p>
            <p className="font-semibold mt-1">{data.email}</p>
            <p className="text-sm text-slate-500 mt-2">
              Role: <span className="font-medium text-slate-700">{data.role || "Loading..."}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-6 text-center">
              <p className="text-sm text-slate-500">Jobs</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{data.jobsCount}</p>
            </div>
            <div className="border border-slate-200 rounded-xl p-6 text-center">
              <p className="text-sm text-slate-500">Candidates</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{data.candidatesCount}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
            onClick={() => router.push("/jobs")}
          >
            Jobs
          </button>

          <button
            className="border border-slate-300 px-5 py-2 rounded-lg hover:bg-slate-50 transition"
            onClick={() => router.push("/kanban")}
          >
            Kanban
          </button>

          {data.role === "admin" && (
            <button
              className="border border-slate-300 px-5 py-2 rounded-lg hover:bg-slate-50 transition"
              onClick={() => router.push("/admin")}
            >
              Admin
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
