const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB Connected Successfully!"))
  .catch((err) => console.error("🔴 MongoDB Connection Error:", err));

// Game Schema & Model
const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  platform: { type: String, required: true },
  category: { type: String, required: true },
  rating: { type: Number, default: 4.5 },
  downloads: { type: String, default: "10K+" },
  desc: { type: String, default: "" },
  popular: { type: Boolean, default: false },
  new: { type: Boolean, default: true },
  img: { type: String, default: "🎮" }
});

const Game = mongoose.model('Game', gameSchema);

// 1. GET Route: Saare games database se lane ke liye
app.get('/api/games', async (req, res) => {
  try {
    const games = await Game.find();
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. POST Route: Naya game add karne ke liye (Admin Panel ke liye)
app.post('/api/games', async (req, res) => {
  try {
    const newGame = new Game(req.body);
    const savedGame = await newGame.save();
    res.status(201).json(savedGame);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 3. DELETE Route: Game delete karne ke liye (Admin Panel ke liye)
app.delete('/api/games/:id', async (req, res) => {
  try {
    await Game.findByIdAndDelete(req.params.id);
    res.json({ message: "Game deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Root Route
app.get('/', (req, res) => {
  res.send('TechVerge API Server Running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
