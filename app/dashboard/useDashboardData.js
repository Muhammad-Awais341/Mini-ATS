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

  // Managers and admins see job counts, candidate counts, and recent candidate activity
  let jobsQuery = supabase.from('jobs').select('*', { count: 'exact', head: true });
  if (role !== 'admin') {
    // Managers only see their own job counts
    jobsQuery = jobsQuery.eq('created_by', user.id);
  }
  const { count: jobsCount } = await jobsQuery;

  let candidatesQuery = supabase.from('candidates').select('*', { count: 'exact', head: true });
  let recentQuery = supabase
    .from('candidates')
    .select('*')
    .order('created_at', { ascending: false });

  if (role !== 'admin') {
    const { data: jobs } = await supabase.from('jobs').select('id').eq('created_by', user.id);
    const jobIds = jobs?.map((j) => j.id) || [];
    if (jobIds.length > 0) {
      candidatesQuery = candidatesQuery.in('job_id', jobIds);
      recentQuery = recentQuery.in('job_id', jobIds);
    } else {
      return {
        email: user.email,
        role,
        name,
        jobsCount: jobsCount || 0,
        candidatesCount: 0,
        recentCandidates: [],
      };
    }
  }

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
