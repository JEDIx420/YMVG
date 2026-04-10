import { Business } from '@/types/database.types';
import DirectoryClient from '@/components/DirectoryClient';
import { createClient } from '@/utils/supabase/server';

export const revalidate = 0;

export default async function DirectoryPage() {
  const supabase = await createClient();
  
  // Fetch initial data on the server for web crawlers (SEO)
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('*')
    .limit(100);

  if (error) {
    console.error('Error fetching businesses:', error);
  }

  const initialList = businesses as Business[] || [];

  return (
    <main className="bg-slate-50 min-h-screen">
      <DirectoryClient initialBusinesses={initialList} />
    </main>
  );
}
