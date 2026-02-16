"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [jobsCount, setJobsCount] = useState(0);
  const [candidatesCount, setCandidatesCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const currentRole = profile?.role || "";
      setRole(currentRole);

      let jobsQuery = supabase.from("jobs").select("*", { count: "exact", head: true });
      if (currentRole !== "admin") jobsQuery = jobsQuery.eq("created_by", user.id);
      const { count: jobsTotal } = await jobsQuery;
      setJobsCount(jobsTotal || 0);

      let candidatesQuery = supabase.from("candidates").select("*", { count: "exact", head: true });

      if (currentRole !== "admin") {
        const { data: jobs } = await supabase.from("jobs").select("id").eq("created_by", user.id);
        const jobIds = jobs?.map((j) => j.id) || [];
        if (jobIds.length > 0) candidatesQuery = candidatesQuery.in("job_id", jobIds);
      }

      const { count: candidatesTotal } = await candidatesQuery;
      setCandidatesCount(candidatesTotal || 0);
    };

    load();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

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
            <p className="font-semibold mt-1">{email}</p>
            <p className="text-sm text-slate-500 mt-2">
              Role: <span className="font-medium text-slate-700">{role || "Loading..."}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-6 text-center">
              <p className="text-sm text-slate-500">Jobs</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{jobsCount}</p>
            </div>
            <div className="border border-slate-200 rounded-xl p-6 text-center">
              <p className="text-sm text-slate-500">Candidates</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{candidatesCount}</p>
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

          {role === "admin" && (
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
