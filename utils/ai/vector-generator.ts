import { getEmbedding } from "@/app/actions/getEmbedding";
import { Business } from "@/types/database.types";

/**
 * Synthesizes a semantic text string from business data and fetches its vector embedding.
 * Safe to call with Partial<Business>, gracefully handles missing fields.
 */
export async function generateBusinessVector(businessData: Partial<Business>): Promise<number[] | null> {
  const brandName = businessData.brand_name || '';
  const category = businessData.category || 'General';
  const description = businessData.description || '';
  const services = Array.isArray(businessData.services) 
    ? businessData.services.join(', ') 
    : (businessData.services || '');

  const textToEmbed = `${brandName} in ${category}. ${description}. Services: ${services}`.trim();
  
  if (!textToEmbed) {
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
