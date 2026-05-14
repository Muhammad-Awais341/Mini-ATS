"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";

const COLUMNS = ["applied", "interview", "offer", "rejected"];

const fetchJobs = async (supabase) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let q = supabase.from("jobs").select("*").order("created_at", { ascending: false });
  if (profile?.role !== "admin") q = q.eq("created_by", user.id);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
};

const fetchCandidates = async (supabase, jobId) => {
  if (!jobId) return [];
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export default function KanbanPage() {
  const [supabase, setSupabase] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobIdFromUrl = searchParams.get("jobId") || "";

  const [search, setSearch] = useState("");

  // Candidate form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");

  useEffect(() => {
    setSupabase(createSupabaseBrowserClient());
  }, []);

  const { data: jobs, error: jobsError } = useSWR(supabase ? ["jobs", supabase] : null, ([_, supabase]) => fetchJobs(supabase));

  const jobId = jobIdFromUrl || (jobs && jobs.length > 0 ? jobs[0].id : "");

  const { data: candidates, error: candidatesError, mutate: mutateCandidates } = useSWR(jobId && supabase ? `candidates-${jobId}` : null, () => fetchCandidates(supabase, jobId));

  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];
    const s = search.trim().toLowerCase();
    if (!s) return candidates;
    return candidates.filter((c) => (c.name || "").toLowerCase().includes(s));
  }, [candidates, search]);

  const grouped = useMemo(() => {
    return COLUMNS.map((status) => ({
      status,
      items: filteredCandidates.filter((c) => c.status === status),
    }));
  }, [filteredCandidates]);

  const addCandidate = async (e) => {
    e.preventDefault();
    if (!jobId) return toast.error("Please select a job first.");

    const { error } = await supabase.from("candidates").insert({
      name,
      email,
      linkedin,
      job_id: jobId,
      status: "applied",
    });

    if (error) return toast.error(error.message);

    setName("");
    setEmail("");
    setLinkedin("");
    mutateCandidates();
    toast.success("Candidate added successfully");
  };

  const updateStatus = async (candidateId, newStatus) => {
    const { error } = await supabase
      .from("candidates")
      .update({ status: newStatus })
      .eq("id", candidateId);

    if (error) return toast.error(error.message);

    mutateCandidates();
    toast.success("Candidate status updated");
  };

  const onChangeJob = (newJobId) => {
    router.replace(`/kanban?jobId=${newJobId}`);
  };

  if (jobsError) return <div>Error loading jobs.</div>;
  if (candidatesError) return <div>Error loading candidates.</div>;
  if (!jobs || !supabase) return <div>Loading...</div>;

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-[1400px] mx-auto bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl p-6 md:p-10 flex flex-col min-h-[85vh]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Candidate Pipeline</h1>
            <p className="text-slate-500 mt-2 text-lg">Track and manage your applicants</p>
          </div>
          <button 
            className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow transition-all font-medium" 
            onClick={() => router.push("/jobs")}
          >
            Back to Jobs
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/60 border border-slate-200 rounded-2xl p-4 mb-8 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Select Job</span>
            <select
              className="bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 shadow-sm outline-none transition-all cursor-pointer"
              value={jobId}
              onChange={(e) => onChangeJob(e.target.value)}
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[250px]">
            <input
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 shadow-sm outline-none transition-all"
              placeholder="Search candidates by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Add Candidate Form */}
        <form onSubmit={addCandidate} className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="bg-indigo-600 w-2 h-6 rounded-full inline-block"></span>
            Add New Candidate
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-700 mb-1 uppercase tracking-wide">Full Name *</label>
              <input
                className="w-full border border-slate-200 bg-white p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none shadow-sm text-sm"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-700 mb-1 uppercase tracking-wide">Email</label>
              <input
                className="w-full border border-slate-200 bg-white p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none shadow-sm text-sm"
                placeholder="jane@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-700 mb-1 uppercase tracking-wide">LinkedIn URL</label>
              <input
                className="w-full border border-slate-200 bg-white p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none shadow-sm text-sm"
                placeholder="https://linkedin.com/in/..."
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
            </div>
            <div className="md:col-span-1">
              <button className="w-full bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-semibold text-sm h-[46px]">
                Add to Pipeline
              </button>
            </div>
          </div>
        </form>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max h-full">
            {grouped.map((col) => (
              <div key={col.status} className="w-[320px] flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200/60 p-4 h-full">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      col.status === 'applied' ? 'bg-blue-400' :
                      col.status === 'interview' ? 'bg-amber-400' :
                      col.status === 'offer' ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}></span>
                    {col.status}
                  </h3>
                  <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {col.items.length}
                  </span>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto pr-1 pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                  {col.items.map((c) => (
                    <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <p className="font-bold text-slate-800 text-lg">{c.name}</p>
                      
                      {c.email && (
                        <div className="mt-2 flex items-center gap-1.5 text-slate-500 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      
                      {c.linkedin && (
                        <div className="mt-1 flex items-center gap-1.5 text-indigo-600 text-sm font-medium">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                          <a className="hover:underline truncate" href={c.linkedin} target="_blank" rel="noopener noreferrer">
                            Profile
                          </a>
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <select
                          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2 outline-none cursor-pointer hover:bg-white transition-colors"
                          value={c.status}
                          onChange={(e) => updateStatus(c.id, e.target.value)}
                        >
                          {COLUMNS.map((s) => (
                            <option key={s} value={s}>
                              Move to {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {col.items.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <p className="text-sm font-medium text-slate-400">Drop candidates here</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
