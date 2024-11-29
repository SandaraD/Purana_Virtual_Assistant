require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const connectDB = require('./config/db'); 
const chatbotRoutes = require('./routes/chatbot');


const embeddingService = require('./services/embeddingService');

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});

// Connect to DB
connectDB();

// MongoDB URI and Client
const uri = 'mongodb+srv://SandaraD:SanDew2004@kingstonfinalproject.ebftjn5.mongodb.net/?retryWrites=true&w=majority&appName=KingstonFinalProject';
const client = new MongoClient(uri);

// Example route to insert site data and generate embedding
app.post('/api/sites', async (req, res) => {
    try {
        const { name, size, location, description } = req.body;

        await client.connect();
        const db = client.db('test'); 
        const collection = db.collection('sites');

        // Insert the site document
        const result = await collection.insertOne({
            name,
            size,
            location,
            description
        });

        console.log('Document inserted with ID:', result.insertedId);

        // Generate embedding for the description
        console.log('Generating embedding for the description:', description);
        const embedding = await embeddingService.embedText(description); 

        console.log('Generated embedding:', embedding);


        await collection.updateOne(
            { _id: result.insertedId },
            { $set: { embedding: embedding } }
        );

        console.log('Document updated with embedding:', result.insertedId);

        // Send response back with the result
        res.status(201).json({ message: 'Site added and embedding generated successfully', insertedId: result.insertedId });

    } catch (err) {
        console.error('Error inserting document or generating embedding:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.close();
    }
});

// Routes
app.use('/api/chatbot', chatbotRoutes);

// Listen for requests
app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});

app.use((err, req, res, next) => {
    console.error("Error occurred:", err);
    res.status(500).json({ error: 'Internal server error' });
});

