/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
  },
}

module.exports = nextConfig