"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardData } from "./useDashboardData";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useSWRConfig } from "swr";
import { toast } from "sonner";

function getRoleLabel(role) {
  if (role === "admin") return "Super Admin";
  if (role === "manager") return "Manager (HR)";
  if (role === "candidate") return "Candidate";
  return role || "Loading...";
}

function getRoleBadgeClass(role) {
  if (role === "admin") return "bg-violet-50 text-violet-700 border-violet-100";
  if (role === "manager") return "bg-indigo-50 text-indigo-700 border-indigo-100";
  return "bg-emerald-50 text-emerald-700 border-emerald-100";
}

const STATUS_META = {
  applied: { label: "Applied", class: "bg-blue-50 text-blue-700 border-blue-100" },
  interview: { label: "Interviewing", class: "bg-amber-50 text-amber-700 border-amber-100" },
  offer: { label: "Offer Received 🎉", class: "bg-emerald-50 text-emerald-700 border-emerald-100 font-bold" },
  rejected: { label: "Closed / Rejected", class: "bg-rose-50 text-rose-700 border-rose-100" },
};

export default function DashboardPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const { data, isLoading, isError, mutate } = useDashboardData(supabase);
  const { mutate: globalMutate } = useSWRConfig();

  // Candidate UI states
  const [activeTab, setActiveTab] = useState("explore"); // explore | applications
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Profile Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (data && data.name) {
      setFullName(data.name);
      setProfileName(data.name);
    }
  }, [data]);

  const logout = async () => {
    await supabase.auth.signOut();
    // Clear SWR cache to prevent data leakage between users
    globalMutate(() => true, undefined, { revalidate: false });
    router.push("/login");
  };

  const handleApply = (job) => {
    setSelectedJobForApply(job);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    if (!selectedJobForApply) return;
    setSubmitting(true);

    const { error } = await supabase.from("candidates").insert({
      name: fullName || data.email.split("@")[0],
      email: data.email,
      linkedin: linkedinUrl,
      job_id: selectedJobForApply.id,
      status: "applied",
    });

    setSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Successfully applied for ${selectedJobForApply.title}!`);
      setSelectedJobForApply(null);
      setLinkedinUrl("");
      mutate(); // refresh dashboard SWR cache
    }
  };

  const saveProfileName = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ name: profileName })
      .eq("id", user.id);

    setSavingProfile(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Display name updated successfully!");
      setIsEditingProfile(false);
      mutate(); // refresh dashboard data
    }
  };

  if (isLoading || !supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (isError) {
    router.push("/login");
    return null;
  }

  // --- CANDIDATE PORTAL VIEW ---
  if (data.role === "candidate") {
    const hasOffer = data.myApplications?.some((app) => app.status === "offer");
    
    // Join applications with job titles/descriptions
    const enrichedApplications = data.myApplications?.map((app) => {
      const job = data.allJobs?.find((j) => j.id === app.job_id);
      return { ...app, job };
    }) || [];

    return (
      <div className="min-h-screen p-6 md:p-10 bg-slate-50/50">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          
          {/* Header */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500" />
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  Welcome, {data.name || data.email.split("@")[0]}!
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeClass(data.role)}`}>
                  {getRoleLabel(data.role)}
                </span>
              </div>
              <p className="text-slate-500 mt-2 text-base">
                Discover job opportunities and track your application statuses in real-time.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditingProfile(true)}
                className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl hover:bg-slate-50 shadow-sm transition-all font-semibold text-sm"
              >
                Edit Name
              </button>
              <button
                className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl hover:bg-slate-50 shadow-sm transition-all font-semibold text-sm"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Celebratory Offer Banner */}
          {hasOffer && (
            <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden animate-pulse">
              <div className="absolute inset-0 bg-white/5 pointer-events-none" />
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>🎉</span> Congratulations! You have received a job offer!
                </h2>
                <p className="text-emerald-100 text-sm mt-1.5 leading-relaxed max-w-2xl">
                  An HR manager has extended an offer to you. Please head to your &quot;My Applications&quot; tab to check details or contact your recruiter directly.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("applications")}
                className="bg-white text-emerald-700 px-5 py-2.5 rounded-xl font-bold text-sm shadow hover:bg-emerald-50 transition-colors whitespace-nowrap"
              >
                View Offer Details
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 gap-6">
            <button
              onClick={() => setActiveTab("explore")}
              className={`pb-4 text-base font-bold transition-all relative ${
                activeTab === "explore" ? "text-slate-800" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Explore Openings
              <span className={`absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full transition-all ${
                activeTab === "explore" ? "scale-100" : "scale-0"
              }`} />
              <span className="ml-2 bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {data.allJobs?.length || 0}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab("applications")}
              className={`pb-4 text-base font-bold transition-all relative ${
                activeTab === "applications" ? "text-slate-800" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              My Applications
              <span className={`absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full transition-all ${
                activeTab === "applications" ? "scale-100" : "scale-0"
              }`} />
              <span className="ml-2 bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {enrichedApplications.length}
              </span>
            </button>
          </div>

          {/* Tab Contents */}
          {activeTab === "explore" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.allJobs?.length === 0 ? (
                <div className="md:col-span-2 text-center py-16 bg-white/50 border border-dashed border-slate-200 rounded-3xl">
                  <p className="text-slate-500 text-lg">No active job openings at the moment.</p>
                  <p className="text-slate-400 text-sm mt-1">Please check back later!</p>
                </div>
              ) : (
                data.allJobs.map((job) => {
                  const hasApplied = data.myApplications?.some((app) => app.job_id === job.id);
                  return (
                    <div
                      key={job.id}
                      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full group"
                    >
                      <div className="mb-6">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {job.title}
                          </h3>
                          <span className="text-xs text-slate-400 font-medium whitespace-nowrap bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                            Posted {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-sm line-clamp-4">
                          {job.description || "No description provided."}
                        </p>
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-50 flex">
                        {hasApplied ? (
                          <div className="w-full bg-emerald-50 border border-emerald-100 text-emerald-700 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            Application Submitted
                          </div>
                        ) : (
                          <button
                            onClick={() => handleApply(job)}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 shadow-md transition-all font-semibold text-sm"
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {enrichedApplications.length === 0 ? (
                <div className="text-center py-16 bg-white/50 border border-dashed border-slate-200 rounded-3xl">
                  <p className="text-slate-500 text-lg">You haven&apos;t applied for any positions yet.</p>
                  <button
                    onClick={() => setActiveTab("explore")}
                    className="mt-4 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow hover:bg-indigo-700 transition-colors"
                  >
                    Browse Available Jobs
                  </button>
                </div>
              ) : (
                enrichedApplications.map((app) => {
                  const meta = STATUS_META[app.status] || { label: app.status, class: "bg-slate-50 text-slate-700 border-slate-100" };
                  return (
                    <div
                      key={app.id}
                      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3.5 mb-2.5">
                          <h3 className="text-lg font-bold text-slate-800">
                            {app.job?.title || "Unknown Position"}
                          </h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${meta.class}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">
                          {app.job?.description || "No job description available."}
                        </p>
                        <span className="inline-block text-xs text-slate-400 mt-3">
                          Applied on {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 items-end whitespace-nowrap">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                          Pipeline Stage
                        </span>
                        <div className="flex gap-1.5 mt-1">
                          {COLUMNS.map((stage) => {
                            const isCurrent = app.status === stage;
                            return (
                              <div
                                key={stage}
                                className={`w-3.5 h-3.5 rounded-full border border-white shadow-sm transition-all duration-300 ${
                                  isCurrent
                                    ? stage === "offer"
                                      ? "bg-emerald-500 scale-125 ring-2 ring-emerald-200"
                                      : stage === "rejected"
                                      ? "bg-rose-500 scale-125 ring-2 ring-rose-200"
                                      : stage === "interview"
                                      ? "bg-amber-500 scale-125 ring-2 ring-amber-200"
                                      : "bg-blue-500 scale-125 ring-2 ring-blue-200"
                                    : "bg-slate-200"
                                }`}
                                title={stage}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Edit Profile Name Modal */}
          {isEditingProfile && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden max-w-md w-full relative animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Edit Display Name</h2>
                  <p className="text-slate-500 text-sm mb-6">
                    Enter the name that will be displayed to hiring managers on your job applications.
                  </p>
                  
                  <form onSubmit={saveProfileName} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Full Name
                      </label>
                      <input
                        className="w-full border border-slate-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                        placeholder="Jane Doe"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {savingProfile ? "Saving..." : "Save Name"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Apply Modal */}
          {selectedJobForApply && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden max-w-lg w-full relative animate-in fade-in zoom-in duration-200">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <div className="p-8">
                  
                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      Submit Application
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-2.5">
                      Apply for {selectedJobForApply.title}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1.5">
                      You are applying as <span className="font-semibold text-slate-700">{data.email}</span>.
                    </p>
                  </div>

                  <form onSubmit={submitApplication} className="space-y-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Full Name
                      </label>
                      <input
                        className="w-full border border-slate-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                        placeholder="e.g. Jane Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                        Email Address (Verified)
                      </label>
                      <input
                        className="w-full border border-slate-100 bg-slate-50 text-slate-500 rounded-xl p-3 text-sm cursor-not-allowed outline-none shadow-sm"
                        value={data.email}
                        readOnly
                      />
                    </div>

                    {/* LinkedIn */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        LinkedIn Profile URL
                      </label>
                      <input
                        className="w-full border border-slate-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                        placeholder="https://linkedin.com/in/username"
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedJobForApply(null)}
                        className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : "Submit Application"}
                      </button>
                    </div>
                  </form>

                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // --- HR MANAGER / ADMIN VIEW ---
  const isManager = data.role === "admin" || data.role === "manager";
  
  // Detect recent applicants in the last 24h as a new applicant signifier with safe UTC parsing
  const recentNewApplicant = data.recentCandidates?.find((c) => {
    const appliedDate = new Date(c.created_at.endsWith('Z') ? c.created_at : c.created_at + 'Z');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return appliedDate > oneDayAgo;
  });

  const hasNewApplicants = !!recentNewApplicant;

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Main Content Box */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-400 via-violet-500 to-pink-500" />
          
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

          {/* Elegant New Applicant Alert Signifier */}
          {hasNewApplicants && (
            <div className="mb-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                </span>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    New Applicant Alert
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    A candidate has recently applied for <span className="font-semibold text-amber-955">{recentNewApplicant.jobTitle}</span> within the last 24 hours!
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/kanban?jobId=${recentNewApplicant.job_id}`)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:shadow transition-colors whitespace-nowrap"
              >
                Open Job Pipeline
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Signed in as</p>
              <p className="text-xl font-bold text-slate-800 truncate">{data.email}</p>
              <div className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeClass(data.role)}`}>
                {getRoleLabel(data.role)}
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

          <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-100">
            <button
              className="bg-slate-900 text-white px-6 py-3.5 rounded-xl hover:bg-slate-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-semibold"
              onClick={() => router.push("/jobs")}
            >
              Manage Jobs
            </button>

            <button
              className="bg-white border border-slate-200 text-slate-700 px-6 py-3.5 rounded-xl hover:bg-slate-50 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all font-semibold"
              onClick={() => router.push("/kanban")}
            >
              Candidate Pipeline
            </button>

            {isManager && (
              <button
                className="bg-indigo-55 border border-indigo-100 text-indigo-700 px-6 py-3.5 rounded-xl hover:bg-indigo-100 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all font-semibold"
                onClick={() => router.push("/admin")}
              >
                {data.role === "admin" ? "Admin Panel" : "Manager Panel"}
              </button>
            )}
          </div>
        </div>

        {/* Recent Applicant Activity Feed */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Recent Applications Activity</h2>
              <p className="text-slate-500 text-sm mt-0.5">Real-time status updates of incoming candidates</p>
            </div>
            <span className="text-xs font-semibold bg-slate-50 border border-slate-100 text-slate-500 px-3.5 py-1.5 rounded-full">
              Latest {data.recentCandidates?.length || 0} applications
            </span>
          </div>

          {(!data.recentCandidates || data.recentCandidates.length === 0) ? (
            <div className="text-center py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-slate-500 text-sm">No recent applicant activity found.</p>
              <p className="text-slate-400 text-xs mt-0.5">Applicants will appear here in real-time as they submit applications.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentCandidates.map((c) => {
                // Get initials
                const initials = c.name
                  ? c.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                  : c.email.slice(0, 2).toUpperCase();

                // Compute exact, local-time friendly timestamp with UTC parsing
                const appliedTime = new Date(c.created_at.endsWith('Z') ? c.created_at : c.created_at + 'Z');
                const diffMs = Date.now() - appliedTime.getTime();
                const diffMin = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMin / 60);

                const timeString = appliedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateString = appliedTime.toLocaleDateString([], { month: 'short', day: 'numeric' });

                let timeStr = "";
                if (diffMin < 1) {
                  timeStr = `Just now (${timeString})`;
                } else if (diffMin < 60) {
                  timeStr = `${diffMin}m ago (${timeString})`;
                } else if (diffHours < 24) {
                  timeStr = `${diffHours}h ago (${timeString})`;
                } else if (diffHours < 48) {
                  timeStr = `Yesterday (${timeString})`;
                } else {
                  timeStr = `${dateString} (${timeString})`;
                }

                const statusMeta = STATUS_META[c.status] || { label: c.status, class: "bg-slate-50 text-slate-600 border-slate-100" };

                return (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-slate-100 hover:border-slate-200 rounded-2xl hover:bg-slate-50/55 hover:shadow-sm transition-all gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-800 text-sm">{c.name || "Anonymous"}</h4>
                          <span className="text-xs text-slate-400 font-medium">({c.email})</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusMeta.class}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Applied for <span className="font-semibold text-indigo-600">{c.jobTitle}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-xs text-slate-400 font-medium">{timeStr}</span>
                      <button
                        onClick={() => router.push(`/kanban?jobId=${c.job_id}`)}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition whitespace-nowrap"
                      >
                        View in Pipeline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const COLUMNS = ["applied", "interview", "offer", "rejected"];
