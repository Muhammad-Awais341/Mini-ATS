import useSWR from 'swr';

const fetcher = async ([key, supabase]) => {
  console.log(`[SWR Fetcher] Fetching table: ${key} at ${new Date().toISOString()}`);
  const { data, error } = await supabase
    .from(key)
    .select('*');
  
  if (error) {
    console.error(`[SWR Fetcher] Error fetching ${key}:`, error);
    throw error;
  }
  console.log(`[SWR Fetcher] Successfully fetched ${data.length} items for ${key}`);
  return data;
};

export function useSupabaseData(table, supabase, config = {}) {
  // Use the table name as the primary key. 
  const { data, error, mutate } = useSWR(
    supabase ? [table, 'browser-client'] : null, 
    async ([tableName]) => {
      console.log(`[useSupabaseData] Fetcher triggered for table: "${tableName}" at ${new Date().toLocaleTimeString()}`);
      
      const { data: fetchedData, error: fetchError } = await supabase
        .from(tableName)
        .select('*');
        
      if (fetchError) {
        console.error(`[useSupabaseData] Fetch error for "${tableName}":`, fetchError);
        throw fetchError;
      }
      const ids = fetchedData?.map(item => item.id?.substring(0, 8)) || [];
      console.log(`[useSupabaseData] Successfully fetched ${fetchedData?.length || 0} items for "${tableName}". IDs: [${ids.join(', ')}]`);
      return fetchedData;
    },
    {
      revalidateOnFocus: false, 
      revalidateIfStale: true,
      revalidateOnMount: true,
      dedupingInterval: 0,
      ...config
    }
  );

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
