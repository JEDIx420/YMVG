"use server";

const CATEGORIES = [
  "Professional Services",
  "Technology & Software",
  "Healthcare & Wellness",
  "Construction & Engineering",
  "Retail & E-commerce",
  "Food & Hospitality",
  "Financial Services",
  "Education & Training",
  "Legal Services",
  "Non-Profit & NGO",
  "Other"
];

export async function parseSearchIntent(query: string): Promise<string | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-405b-instruct",
        messages: [
          {
            role: "system",
            content: `You are an Intent Parser for a business directory. 
            Identify if the user query is looking for a specific category of business.
            Valid categories: ${CATEGORIES.join(", ")}.
            Return ONLY a JSON object: {"category": "Exact Category Name" | null}.
            If the query is generic, return null.`
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 50,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    
    if (content.category && CATEGORIES.includes(content.category)) {
      return content.category;
    }
  } catch (error) {
    console.error("Intent Parsing Error:", error);
  }

  return null;
}
