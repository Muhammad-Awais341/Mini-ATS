"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { mutate } from "swr";
import { toast } from "sonner";

export default function EditJobPage() {
  const supabase = createSupabaseBrowserClient();
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId;

  const [job, setJob] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return router.push("/login");

      const { data: jobData, error: fetchError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (fetchError || !jobData) {
        setError("Job not found");
        setLoading(false);
        return;
      }

      // Verify ownership
      if (jobData.created_by !== userData.user.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userData.user.id)
          .single();

        if (profile?.role !== "admin") {
          router.push("/jobs");
          return;
        }
      }

      setJob(jobData);
      setTitle(jobData.title);
      setDescription(jobData.description);
      setLoading(false);
    };

    fetchJob();
  }, [jobId, router, supabase]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    console.log(`[EditJobPage] Starting update for jobId: ${jobId}`);
    setSaving(true);

    const { error: updateError, count } = await supabase
      .from("jobs")
      .update({ title, description }, { count: 'exact' })
      .eq("id", jobId)
      .select(); 

    if (updateError) {
      console.error(`[EditJobPage] Update error:`, updateError);
      toast.error(updateError.message);
      setSaving(false);
      return;
    }

    console.log(`[EditJobPage] Update successful. Rows affected: ${count}`);

    if (count === 0) {
      console.warn(`[EditJobPage] No rows were updated. Check RLS or if the job exists.`);
      toast.error("Job could not be updated. You may not have permission.");
      setSaving(false);
      return;
    }

    console.log(`[EditJobPage] Triggering SWR mutation for ['jobs', 'browser-client']`);
    // Await global mutation to ensure the 'jobs' list is re-fetched before we navigate
    // Use a static key to ensure it matches the one in useSupabaseData
    await mutate(["jobs", "browser-client"]);
    
    console.log(`[EditJobPage] Mutation finished, navigating to /jobs...`);
    toast.success("Job updated successfully");
    router.push("/jobs");
    router.refresh();
  };

  if (loading || !supabase) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto bg-red-100 text-red-700 p-4 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto text-slate-600">
          Job not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Edit Job</h1>
          <button
            onClick={() => router.push("/jobs")}
            className="border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition"
          >
            Back
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Job Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Job Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 h-32"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/jobs")}
              className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
