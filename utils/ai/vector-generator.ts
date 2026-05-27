import { getEmbedding } from "@/app/actions/getEmbedding";
import { Business } from "@/types/database.types";

/**
 * Synthesizes a semantic text string from business data and fetches its vector embedding.
 * Safe to call with Partial<Business>, gracefully handles missing fields.
 */
export async function generateBusinessVector(payload: Partial<Business>): Promise<number[] | null> {
  const textToEmbed = `Company: ${payload.brand_name || ''} | Location: ${payload.city || ''}, ${payload.state || ''}, ${payload.country || ''} | Category: ${payload.category || 'General'} | Description: ${payload.description || ''} | Core Expertise: ${payload.services?.join(', ') || ''}`;
  
  if (!textToEmbed.trim()) {
    return null;
  }

  try {
    const vector = await getEmbedding(textToEmbed, "passage");
    return vector;
  } catch (error) {
    console.error("Failed to generate vector for business:", error);
    return null;
  }
}
