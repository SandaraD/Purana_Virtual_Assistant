// src/services/ChatBotService.js
const { ChatOpenAI } = require("@langchain/openai");
const { MongoClient } = require("mongodb");
const { PromptTemplate } = require("@langchain/core/prompts");
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { text } = require("express");
const mongoose = require('mongoose');
require('dotenv').config();

class ChatBotService {
  constructor() {
    this.client = null;
    this.collection = null;
    this.vectorStore = null;
    this.model = new ChatOpenAI({
        temperature: 0.2,
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-3.5-turbo", // or "gpt-3.5-turbo"
      });
  }

  async initialize() {
    try {
        console.log('Initializing ChatBotService');

        // Connect to MongoDB using Mongoose
        this.client = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB Atlas');

        // Access the collection directly from the Mongoose connection
        this.collection = this.client.connection.collection("sites");

        // Initialize embeddings (make sure you have defined this.embeddings)
        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env file
        });

        // Initialize the vector store
        this.vectorStore = new MongoDBAtlasVectorSearch(
            this.embeddings,
            {
                collection: this.collection,
                indexName: "default",
                textKey: "description",
                embeddingKey: "embedding",
                fields: ["name", "location", "description"],
            }
        );

        console.log('MongoDB connection established');

        await this.ensureDocumentsHaveEmbeddings();

    } catch (error) {
        console.error("Initialization error:", error);
        throw error;
    }
}

  async ensureDocumentsHaveEmbeddings() {
    try {
      // Find documents without embeddings
      const documentsWithoutEmbeddings = await this.collection.find({
        embedding: { $exists: false }
      }).toArray();

      console.log('text');

    //   console.log(Found ${documentsWithoutEmbeddings.length} documents without embeddings);

      // Generate and update embeddings for documents that don't have them
      for (const doc of documentsWithoutEmbeddings) {
        const textToEmbed = doc.description + doc.location + doc.city + doc.name || '';
        if (textToEmbed) {
          const embedding = await this.embeddings.embedQuery(textToEmbed); 
          
          await this.collection.updateOne(
            { _id: doc._id },
            { 
              $set: { 
                embedding: embedding
              }
            }
          );
        //   console.log(Updated embedding for document: ${doc._id});
        }
      }
    } catch (error) {
      console.error("Error ensuring embeddings:", error);
      throw error;
    }
  }

  async askQuestion(question) {
    try {
      const searchResults = await this.vectorStore.similaritySearch(question, 3);
      
      const context = searchResults.map(doc => `
        Name: ${doc.metadata.name}
        Location: ${doc.metadata.location}
        Description: ${doc.pageContent}
      `).join("\n\n");
      
      const promptTemplate = PromptTemplate.fromTemplate(`
        You are an expert travel consultant with in-depth knowledge of Sri Lankan tourism and cultural heritage sites. Your goal is to assist travelers by providing accurate, informative, and engaging answers based on the context provided.
        
        **Context:** 
        {context}
        
        **Question:** 
        {question}
        
        **Instructions:**
        - Use the context to craft a detailed response.
        - If applicable, provide examples to illustrate your points.
        - Ensure your answer is concise yet informative, addressing the question directly.
        - If the context does not contain the information needed to answer the question, politely inform the user that you don't have enough information to provide a response.
        
        **Answer:**
        `);

      const prompt = await promptTemplate.format({
        context: context,
        question: question,
      });

      const response = await this.model.invoke(prompt);
      return response;
    } catch (error) {
      console.error("Error in askQuestion:", error);
      throw error;
    }
  }

  async close() {
    if (this.client) {
      await this.client.close();
    }
  }
}

module.exports = ChatBotService;
