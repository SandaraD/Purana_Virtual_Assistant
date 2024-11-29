const express = require('express');
const { processMessage } = require('../services/messageProcessor');
const router = express.Router();
const ChatBotService = require('../config/openaiService');

router.post('/', async (req, res) => {
    const userMessage = req.body.message;
    try {

        const bot = new ChatBotService();
        await bot.initialize();

        console.log("User message:", userMessage);
        
        const answer = await bot.askQuestion(userMessage)

        return res.json({
            response: answer
        });
    } catch (error) {
        console.error("Error generating response:", error);
        return res.status(500).json({ error: "Error generating response from chatbot" });
    }
});

module.exports = router;


