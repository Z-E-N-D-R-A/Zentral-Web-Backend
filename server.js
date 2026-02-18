import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.BRAWL_API_KEY;

// Test route
app.get("/", (req, res) => {
  res.send("Brawl Backend Running 🚀");
});

// Player route
app.get("/player/:tag", async (req, res) => {
  try {
    const tag = req.params.tag.replace("#", "%23");

    const response = await fetch(
      `https://api.brawlstars.com/v1/players/${tag}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`
        }
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch player data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});