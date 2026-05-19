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

  // Managers and admins see job counts and candidate counts
  let jobsQuery = supabase.from('jobs').select('*', { count: 'exact', head: true });
  if (role !== 'admin') {
    // Managers only see their own job counts
    jobsQuery = jobsQuery.eq('created_by', user.id);
  }
  const { count: jobsCount } = await jobsQuery;

  let candidatesQuery = supabase.from('candidates').select('*', { count: 'exact', head: true });
  if (role !== 'admin') {
    const { data: jobs } = await supabase.from('jobs').select('id').eq('created_by', user.id);
    const jobIds = jobs?.map((j) => j.id) || [];
    if (jobIds.length > 0) {
      candidatesQuery = candidatesQuery.in('job_id', jobIds);
    } else {
      return {
        email: user.email,
        role,
        name,
        jobsCount: jobsCount || 0,
        candidatesCount: 0,
      };
    }
  }

  const { count: candidatesCount } = await candidatesQuery;

  return {
    email: user.email,
    role,
    name,
    jobsCount: jobsCount || 0,
    candidatesCount: candidatesCount || 0,
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
