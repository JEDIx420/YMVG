"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEmbedding } from "./getEmbedding";
import { Business } from "@/types/database.types";

export type SearchResult = Business & {
  final_score: number;
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
        final_score: 1.0
      }));
    }

    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await getEmbedding(trimmedQuery);
    } catch (err) {
      console.error("Error during embedding generation:", err);
    }

    if (!queryEmbedding) {
      console.warn("Semantic search unavailable, falling back to FTS");
    }

    const { data, error } = await supabase.rpc('hybrid_search_businesses', {
      query_embedding: queryEmbedding || null,
      query_text: trimmedQuery,
      category_filter: category === 'All' ? null : category,
      location_filter: location === 'All' ? null : location,
      match_count: 20
    });

    if (error) {
      console.error("Hybrid Search Error:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Dynamic Relational Drop-off Filter
    const topScore = data[0].final_score;
    const DROPOFF_THRESHOLD = 0.50;
    const minimumAcceptableScore = topScore * DROPOFF_THRESHOLD;
    
    const filteredResults = data.filter((business: any) => business.final_score >= minimumAcceptableScore);

    // Stage 3: Score Normalization (RRF max is 1/61, so multiply by 61 for UI %)
    return (filteredResults as SearchResult[]).map(b => ({
      ...b,
      final_score: Math.min(b.final_score * 61, 1.0)
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
