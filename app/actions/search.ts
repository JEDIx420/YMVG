"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Business } from "@/types/database.types";

export type SearchResult = Business & {
  search_score: number;
  is_boosted: boolean;
};

export async function performHybridSearch(
  searchText: string, 
  category: string | null,
  location: string | null = null
): Promise<SearchResult[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const trimmedQuery = searchText.trim();

    // Stage 1: Empty Query Bypass (Category/Location-only browsing)
    if (!trimmedQuery) {
      let query = supabase.from('businesses').select('*');
      
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      if (location && location !== 'All') {
        query = query.eq('city', location);
      }
      
      const { data, error } = await query.limit(20);
      
      if (error) {
        console.error("Simple Category Search Error:", error);
        return [];
      }

      // Map to SearchResult with 100% match score
      return (data as Business[]).map(b => ({
        ...b,
        search_score: 1.0,
        is_boosted: false
      }));
    }

    const { data, error } = await supabase.rpc('keyword_search_businesses', {
      query_text: trimmedQuery,
      category_filter: category === 'All' ? null : category,
      location_filter: location === 'All' ? null : location,
      match_count: 20
    });

    if (error) {
      console.error("Keyword Search Error:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Dynamic Relational Drop-off Filter
    const topScore = data[0].search_score;
    const DROPOFF_THRESHOLD = 0.50;
    const minimumAcceptableScore = topScore * DROPOFF_THRESHOLD;
    
    const filteredResults = data.filter((business: any) => business.search_score >= minimumAcceptableScore);

    return (filteredResults as SearchResult[]).map(b => ({
      ...b,
      search_score: b.search_score,
      is_boosted: b.is_boosted
    }));
  } catch (err) {
    console.error("performHybridSearch failed:", err);
    return [];
  }
}

export async function getUniqueCategories(): Promise<string[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;

    // Get unique categories and sort them
    const unique = Array.from(new Set(data.map(item => item.category))) as string[];
    return unique.sort();
  } catch (err) {
    console.error("Failed to fetch unique categories:", err);
    return [];
  }
}

export async function getUniqueCities(): Promise<string[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('city')
      .not('city', 'is', null);

    if (error) throw error;

    // Get unique cities, filter out empty strings, and sort them
    const unique = Array.from(new Set(data.map(item => item.city).filter(Boolean))) as string[];
    return unique.sort();
  } catch (err) {
    console.error("Failed to fetch unique cities:", err);
    return [];
  }
}
