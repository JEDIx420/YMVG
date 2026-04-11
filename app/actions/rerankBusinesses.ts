"use server";

import { Business } from "@/types/database.types";

export type RankedBusiness = Business & {
  ai_score: number;
};

export async function rerankBusinesses(
  query: string, 
  businesses: Business[],
  p_minScore: number = 0.3
): Promise<RankedBusiness[]> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey || businesses.length === 0) {
    return businesses.map(b => ({ ...b, ai_score: 0 }));
  }

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/retrieval/nvidia/reranking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "nvidia/nv-rerankqa-mistral-4b-v3",
        query: { text: query },
        passages: businesses.map(b => ({
          text: `${b.brand_name}. ${b.category}. ${b.description}`
        })),
        truncate: "END"
      })
    });

    const data = await response.json();
    
    if (!data.rankings) {
      console.error("Rerank API Error:", data);
      return businesses.map(b => ({ ...b, ai_score: 0 }));
    }

    // Map the rankings back to the original businesses
    // NVIDIA returns rankings in the same order as passages or with indices
    const rankedResults: RankedBusiness[] = data.rankings
      .map((rank: any) => {
        const business = businesses[rank.index];
        return {
          ...business,
          ai_score: rank.logit // Or rank.score depending on API version
        };
      })
      .filter((b: RankedBusiness) => b.ai_score >= p_minScore) // Prune results below threshold
      .sort((a: RankedBusiness, b: RankedBusiness) => b.ai_score - a.ai_score);

    return rankedResults;
  } catch (error) {
    console.error("Reranking failed:", error);
    return businesses.map(b => ({ ...b, ai_score: 0 }));
  }
}
