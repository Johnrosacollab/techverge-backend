const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Essential to parse incoming form payloads

// MongoDB Connection Setup
const uri = process.env.MONGO_URI;
if (!uri) {
    console.error("❌ CRITICAL: MONGO_URI environment variable is missing!");
    process.exit(1);
}

const client = new MongoClient(uri);
let db, gamesCollection;

async function connectDB() {
    try {
        await client.connect();
        console.log("🚀 MongoDB Atlas Connected Cleanly via Driver!");
        db = client.db('techverge_db');
        gamesCollection = db.collection('games');
    } catch (err) {
        console.error("❌ MongoDB Connection Failure:", err);
        // Do not crash server, retry on next request fallback
    }
}
connectDB();

// Middleware to ensure DB connection is ready on request route
app.use((req, res, next) => {
    if (!gamesCollection) {
        return res.status(503).json({ error: "Database initialization in progress. Please retry in a moment." });
    }
    next();
});

// --- API ENDPOINTS ---

// 1. Get all games
app.get('/api/games', async (req, res) => {
    try {
        const games = await gamesCollection.find({}).toArray();
        res.json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Add a new game (Failsafe dynamic normalization)
app.post('/api/games', async (req, res) => {
    try {
        const body = req.body;
        
        // Dynamic map mapping incoming payloads safely to avoid structural rejection
        const gamePayload = {
            name: body.name || "Untitled Game",
            platform: body.platform || "unknown",
            category: body.category || "general",
            rating: parseFloat(body.rating) || 4.5,
            downloads: body.downloads || "0",
            desc: body.desc || "",
            createdAt: new Date()
        };

        const result = await gamesCollection.insertOne(gamePayload);
        res.status(201).json({ _id: result.insertedId, ...gamePayload });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Delete a game
app.delete('/api/games/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid document target ID structure." });
        }
        const result = await gamesCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Game asset not found." });
        }
        res.json({ message: "Game cleared out successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Root Route verification fallback
app.get('/', (req, res) => {
    res.send("TechVerge API Engine Active & Synchronized.");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Active tracking server streaming on cluster port ${PORT}`));
