"use server";

export async function getEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY environment variable is not set');
  }

  const response = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: [text],
      model: "nvidia/llama-3.2-nemoretriever-300m-embed-v1",
      input_type: "query",
      encoding_format: "float",
      truncate: "NONE"
    })
  });

  const data = await response.json();
  if (data.data && data.data[0] && data.data[0].embedding) {
    return data.data[0].embedding as number[];
  }
  
  console.error("NVIDIA Embedded API Error:", data);
  return null;
}
