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
  category: string | null
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

    // Stage 1: Empty Query Bypass (Category-only browsing)
    if (!trimmedQuery) {
      let query = supabase.from('businesses').select('*');
      
      if (category && category !== 'All') {
        query = query.eq('category', category);
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

    // Stage 2: Hybrid Search with AI & Vector RPC (IF text is present)
    const queryEmbedding = await getEmbedding(trimmedQuery);
    if (!queryEmbedding) {
      console.error("Failed to generate embedding for search");
      return [];
    }

    const { data, error } = await supabase.rpc('hybrid_search_businesses', {
      query_embedding: queryEmbedding,
      query_text: trimmedQuery,
      category_filter: category === 'All' ? null : category,
      match_count: 20
    });

    if (error) {
      console.error("Hybrid Search Error:", error);
      return [];
    }

    // Stage 3: Score Normalization (RRF max is 1/61, so multiply by 61 for UI %)
    return (data as SearchResult[]).map(b => ({
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
