import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.BRAWL_API_KEY;
const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
const BASE_URL = "https://api.brawlstars.com/v1";

async function brawlRequest(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      message: error.reason || "Brawl API Error"
    };
  }

  return response.json();
}

app.get("/", (req, res) => {
  res.send("Brawl Backend Running 🚀");
});

app.get("/player/:tag", async (req, res) => {
  try {
    const tag = req.params.tag.replace("#", "").toUpperCase();
    const data = await brawlRequest(`/players/%23${tag}`);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Failed to fetch player"
    });
  }
});

app.get("/battlelog/:tag", async (req, res) => {
  try {
    const tag = req.params.tag.replace("#", "").toUpperCase();
    const data = await brawlRequest(`/players/%23${tag}/battlelog`);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Failed to fetch player"
    });
  }
});

app.get("/club/:tag", async (req, res) => {
  try {
    const tag = req.params.tag.replace("#", "").toUpperCase();
    const data = await brawlRequest(`/clubs/%23${tag}`);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Failed to fetch club"
    });
  }
});

app.get("/rankings/players", async (req, res) => {
  try {
    const data = await brawlRequest(`/rankings/global/players`);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Failed to fetch rankings"
    });
  }
});

app.get("/rankings/brawlers/:brawlerId", async (req, res) => {
  try {
    const id = req.params.brawlerId;
    const data = await brawlRequest(`/rankings/global/brawlers/${id}`);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Failed to fetch rankings"
    });
  }
});

app.get("/brawlers", async (req, res) => {
  try {
    const data = await brawlRequest("/brawlers");
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Failed to fetch brawlers"
    });
  }
});

app.get("/brawler/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await brawlRequest(`/brawlers/${id}`);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Failed to fetch brawler"
    });
  }
});

app.get("/gamemodes", async (req, res) => {
  try {
    const data = await brawlRequest("/gamemodes");
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Failed to fetch game modes"
    });
  }
});

app.get("/events", async (req, res) => {
  try {
    const data = await brawlRequest("/events/rotation");
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Failed to fetch events"
    });
  }
});

app.get("/gif", async (req, res) => {
  try {
    const query = req.query.q;
    const limit = 3;

    let endpoint;

    if (!query || query.toLowerCase() === "trending") {
      endpoint = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=pg`;
    } else {
      endpoint = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&rating=pg`;
    }

    const response = await fetch(endpoint);
    const data = await response.json();

    if (!data.data.length) {
      return res.status(404).json({ error: "No GIF found" });
    }

    const gifs = data.data.map(g => ({
      id: g.id,
      preview: g.images.fixed_width_small.url,
      full: g.images.original.url
    }));

    res.json({ gifs });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch GIFs" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});