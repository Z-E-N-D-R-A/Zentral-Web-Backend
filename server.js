import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import { HttpsProxyAgent } from "https-proxy-agent";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.BRAWL_API_KEY;
const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

const PROXY_URL = process.env.PROXY_URL || "";
const BASE_URL = process.env.BRAWL_BASE_URL || (PROXY_URL ? "https://api.brawlstars.com/v1" : "https://bsproxy.royaleapi.dev/v1");
const agent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined;

function safeHttpStatus(status) {
  const code = Number(status) || 500;
  if (code === 407) return 502;
  return code >= 400 && code < 600 ? code : 500;
}

async function brawlRequest(endpoint) {
  const fetchOptions = {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json"
    }
  };
  if (agent) {
    fetchOptions.agent = agent;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw {
      status: safeHttpStatus(response.status),
      message:
        response.status === 407
          ? "Upstream proxy authentication failed (407). Switch to RoyaleAPI proxy (45.79.218.79) or update PROXY_URL."
          : (error.reason || error.message || "Brawl API Error")
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
    res.status(safeHttpStatus(err.status)).json({
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
    res.status(safeHttpStatus(err.status)).json({
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
    res.status(safeHttpStatus(err.status)).json({
      error: err.message || "Failed to fetch club"
    });
  }
});

app.get("/rankings/players", async (req, res) => {
  try {
    const data = await brawlRequest(`/rankings/global/players`);
    res.json(data);
  } catch (err) {
    res.status(safeHttpStatus(err.status)).json({
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
    res.status(safeHttpStatus(err.status)).json({
      error: err.message || "Failed to fetch rankings"
    });
  }
});

app.get("/brawlers", async (req, res) => {
  try {
    const data = await brawlRequest("/brawlers");
    res.json(data);
  } catch (err) {
    res.status(safeHttpStatus(err.status)).json({
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
    res.status(safeHttpStatus(err.status)).json({
      error: err.message || "Failed to fetch brawler"
    });
  }
});

app.get("/gamemodes", async (req, res) => {
  try {
    const data = await brawlRequest("/gamemodes");
    res.json(data);
  } catch (err) {
    res.status(safeHttpStatus(err.status)).json({
      error: err.message || "Failed to fetch game modes"
    });
  }
});

app.get("/events", async (req, res) => {
  try {
    const data = await brawlRequest("/events/rotation");
    res.json(data);
  } catch (err) {
    res.status(safeHttpStatus(err.status)).json({
      error: err.message || "Failed to fetch events"
    });
  }
});

app.get("/gif", async (req, res) => {
  try {
    const query = req.query.q;
    const limit = 4;

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