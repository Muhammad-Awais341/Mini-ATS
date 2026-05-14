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
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Kanban</h1>
          <button className="border px-3 py-1 rounded" onClick={() => router.push("/jobs")}>
            Back to Jobs
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Job:</span>
          <select
            className="border p-2 rounded"
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

        <input
          className="border p-2 rounded flex-1 min-w-[220px]"
          placeholder="Search candidate by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <form onSubmit={addCandidate} className="mt-6 border rounded p-4 space-y-3">
        <h2 className="font-semibold">Add Candidate</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="border p-2 rounded"
            placeholder="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="border p-2 rounded"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="LinkedIn URL"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
          />
        </div>

        <button className="bg-black text-white px-4 py-2 rounded">
          Add
        </button>
      </form>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {grouped.map((col) => (
          <div key={col.status} className="border rounded p-3">
            <h3 className="font-semibold capitalize">{col.status}</h3>

            <div className="mt-3 space-y-3">
              {col.items.map((c) => (
                <div key={c.id} className="border rounded p-3">
                  <p className="font-semibold">{c.name}</p>
                  {c.email && <p className="text-sm text-gray-600">{c.email}</p>}
                  {c.linkedin && (
                    <a className="text-sm underline" href={c.linkedin} target="_blank">
                      LinkedIn
                    </a>
                  )}

                  <div className="mt-3">
                    <select
                      className="border p-2 rounded w-full"
                      value={c.status}
                      onChange={(e) => updateStatus(c.id, e.target.value)}
                    >
                      {COLUMNS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              {col.items.length === 0 && (
                <p className="text-sm text-gray-500">No candidates</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
