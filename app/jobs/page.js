"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useSupabaseData } from "@/lib/hooks";
import { toast } from "sonner";

export default function JobsPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const { data: jobs, isLoading, isError, mutate } = useSupabaseData("jobs", supabase);
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deletingJobId, setDeletingJobId] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return router.push("/login");
      setUserId(user.id);
    };
    getUser();
  }, [supabase, router]);

  const createJob = async (e) => {
    e.preventDefault();
    if (!userId) {
      toast.error("User ID not loaded. Please wait.");
      return;
    }
    console.log(`[JobsPage] Creating job: "${title}" with userId: ${userId}`);

    const { error, data } = await supabase.from("jobs").insert({
      title,
      description,
      created_by: userId,
    }).select();

    if (error) {
      console.error(`[JobsPage] Create error:`, error);
      toast.error(error.message);
      return;
    }

    console.log(`[JobsPage] Create successful. New job ID: ${data[0]?.id}, Assigned created_by: ${data[0]?.created_by}`);
    setTitle("");
    setDescription("");
    await mutate();
    
    console.log(`[JobsPage] SWR mutation completed, refreshing router...`);
    router.refresh();
    
    toast.success("Job created successfully");
  };

  const deleteJob = async (jobId, jobTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${jobTitle}"? This cannot be undone.`
    );
    if (!confirmed) return;

    console.log(`[JobsPage] Attempting to delete job: ${jobId} (${jobTitle})`);
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log(`[JobsPage] Current session user ID: ${session?.user?.id}`);
    
    setDeletingJobId(jobId);

    // Use { count: 'exact' } to see how many rows were actually deleted
    const { error, count } = await supabase
      .from("jobs")
      .delete({ count: 'exact' })
      .eq("id", jobId);

    if (error) {
      console.error(`[JobsPage] Delete error:`, error);
      toast.error(`Error deleting job: ${error.message}`);
      setDeletingJobId(null);
      return;
    }

    console.log(`[JobsPage] Delete successful. Rows affected: ${count}`);
    
    if (count === 0) {
      console.warn(`[JobsPage] No rows were deleted. This might be an RLS issue or the job was already deleted.`);
      toast.error("Job could not be deleted. You may not have permission.");
      setDeletingJobId(null);
      return;
    }

    console.log(`[JobsPage] Triggering SWR mutation...`);
    // Explicitly mutate with the same key used in useSupabaseData
    await mutate(); 
    
    console.log(`[JobsPage] SWR mutation completed, refreshing router...`);
    router.refresh();
    
    toast.success("Job deleted successfully");
    setDeletingJobId(null);
  };

  if (isLoading || !supabase) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading jobs.</div>;
  }

  

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
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-slate-800">{job.title}</h3>
                  <p className="text-slate-500 mt-1">{job.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="px-3 py-1 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteJob(job.id, job.title)}
                    disabled={deletingJobId === job.id}
                    className="px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {deletingJobId === job.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

