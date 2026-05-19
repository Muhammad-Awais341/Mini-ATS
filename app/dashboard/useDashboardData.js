import useSWR from 'swr';

const fetcher = async ([supabase]) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role || '';
  // Both root admin and managers see all data
  const isPrivileged = role === 'admin' || role === 'manager';

  let jobsQuery = supabase.from('jobs').select('*', { count: 'exact', head: true });
  if (!isPrivileged) {
    jobsQuery = jobsQuery.eq('created_by', user.id);
  }
  const { count: jobsCount } = await jobsQuery;

  let candidatesQuery = supabase.from('candidates').select('*', { count: 'exact', head: true });
  if (!isPrivileged) {
    const { data: jobs } = await supabase.from('jobs').select('id').eq('created_by', user.id);
    const jobIds = jobs?.map((j) => j.id) || [];
    if (jobIds.length > 0) {
      candidatesQuery = candidatesQuery.in('job_id', jobIds);
    } else {
      return {
        email: user.email,
        role,
        jobsCount: jobsCount || 0,
        candidatesCount: 0,
      };
    }
  }

  const { count: candidatesCount } = await candidatesQuery;

  return {
    email: user.email,
    role,
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
