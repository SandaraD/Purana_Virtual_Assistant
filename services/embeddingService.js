// services/embeddingService.js
const { OpenAI } = require('openai'); 

class EmbeddingService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY, 
        });
    }

    async embedText(text) {
        try {
            const response = await this.openai.embeddings.create({
                model: 'gpt-3.5-turbo',
                input: text,
            });

            // Return the embedding
            return response.data[0].embedding;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw new Error('Embedding generation failed');
        }
    }
}

module.exports = new EmbeddingService();

