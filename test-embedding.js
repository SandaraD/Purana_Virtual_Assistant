const { OpenAIEmbeddings } = require("@langchain/openai");
require('dotenv').config();

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY, // Load from .env
});

async function testEmbedding() {
  try {
    const text = "This is a test description for embedding generation.";
    console.log("Text to embed:", text);

    // Use embedQuery instead of embedText
    const embedding = await embeddings.embedQuery(text);

    console.log("Generated embedding:", embedding);
  } catch (error) {
    console.error("Error generating embedding:", error);
  }
}

testEmbedding();

