const MODEL_ID = "sentence-transformers/all-mpnet-base-v2"
const HF_API_URL = `https://api-inference.huggingface.co/pipeline/feature-extraction/${MODEL_ID}`

export async function getQueryEmbedding(text: string) {
  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get embeddings: ${response.statusText}`)
  }

  return response.json()
}