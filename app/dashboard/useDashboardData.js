import useSWR from 'swr';

const fetcher = async ([supabase]) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single();

  const role = profile?.role || '';
  const name = profile?.name || '';
  const isPrivileged = role === 'admin' || role === 'manager';

  if (role === 'candidate') {
    // Candidates see all jobs and their own applications
    const { data: allJobs } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: myApplications } = await supabase
      .from('candidates')
      .select('*')
      .eq('email', user.email)
      .order('created_at', { ascending: false });

    return {
      email: user.email,
      role,
      name,
      allJobs: allJobs || [],
      myApplications: myApplications || [],
    };
  }

  // Managers and admins see ALL job counts, candidate counts, and recent candidate activity globally
  let jobsQuery = supabase.from('jobs').select('*', { count: 'exact', head: true });
  const { count: jobsCount } = await jobsQuery;

  let candidatesQuery = supabase.from('candidates').select('*', { count: 'exact', head: true });
  let recentQuery = supabase
    .from('candidates')
    .select('*')
    .order('created_at', { ascending: false });

  const { count: candidatesCount } = await candidatesQuery;
  const { data: recentCandidates } = await recentQuery.limit(5);

  // Fetch job titles to build jobMap on client side
  const { data: activeJobs } = await supabase.from('jobs').select('id, title');
  const jobMap = {};
  activeJobs?.forEach((j) => {
    jobMap[j.id] = j.title;
  });

  const formattedRecent = (recentCandidates || []).map((c) => ({
    ...c,
    jobTitle: jobMap[c.job_id] || 'Unknown Position',
  }));

  return {
    email: user.email,
    role,
    name,
    jobsCount: jobsCount || 0,
    candidatesCount: candidatesCount || 0,
    recentCandidates: formattedRecent,
  };
};

export function useDashboardData(supabase) {
  const { data, error, mutate } = useSWR(supabase ? [supabase] : null, fetcher);

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
