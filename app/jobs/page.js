"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function JobsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const loadJobs = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return router.push("/login");

    setUserId(user.id);

    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    setJobs(jobsData || []);
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const createJob = async (e) => {
    e.preventDefault();

    await supabase.from("jobs").insert({
      title,
      description,
      created_by: userId,
    });

    setTitle("");
    setDescription("");
    loadJobs();
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Jobs</h1>
          <button
            className="border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition"
            onClick={() => router.push("/dashboard")}
          >
            Back
          </button>
        </div>

        <form onSubmit={createJob} className="border border-slate-200 rounded-xl p-6 mb-8 space-y-4">
          <h2 className="font-semibold text-slate-700">Create Job</h2>

          <input
            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200"
            placeholder="Job title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200"
            placeholder="Job description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition">
            Add Job
          </button>
        </form>

        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition"
            >
              <h3 className="font-semibold text-slate-800">{job.title}</h3>
              <p className="text-slate-500 mt-1">{job.description}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
