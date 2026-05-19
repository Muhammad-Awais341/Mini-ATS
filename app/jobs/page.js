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

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin" && profile?.role !== "manager") {
        return router.push("/dashboard");
      }

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
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-6xl mx-auto bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl p-8 md:p-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Manage Jobs</h1>
            <p className="text-slate-500 mt-2 text-lg">Create and oversee your open positions</p>
          </div>
          <button
            className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow transition-all font-medium"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>

        <form onSubmit={createJob} className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-8 mb-10 shadow-sm space-y-5">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Create New Job</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
            <input
              className="w-full border border-slate-200 bg-white p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none shadow-sm"
              placeholder="e.g. Senior Frontend Developer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
            <textarea
              className="w-full border border-slate-200 bg-white p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none shadow-sm min-h-[100px]"
              placeholder="Briefly describe the role and responsibilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button className="bg-slate-900 text-white px-8 py-3 rounded-xl hover:bg-slate-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-semibold">
              Publish Job
            </button>
          </div>
        </form>

        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Active Jobs</h2>
          {jobs.length === 0 ? (
             <div className="text-center py-12 bg-white/50 border border-dashed border-slate-300 rounded-2xl">
               <p className="text-slate-500">No jobs posted yet. Create one above!</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between h-full"
                >
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                    <p className="text-slate-600 mt-3 line-clamp-3 leading-relaxed">{job.description}</p>
                  </div>
                  <div className="flex gap-3 mt-auto pt-4 border-t border-slate-100">
                    <button
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      className="flex-1 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-medium hover:bg-indigo-100 transition-colors"
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={() => deleteJob(job.id, job.title)}
                      disabled={deletingJobId === job.id}
                      className="flex-1 bg-rose-50 text-rose-700 px-4 py-2 rounded-xl font-medium hover:bg-rose-100 transition-colors disabled:opacity-50"
                    >
                      {deletingJobId === job.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

