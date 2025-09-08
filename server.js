import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const {
  UCS_PROJECT_ID,
  UCS_KEY_ID,
  UCS_SECRET_KEY
} = process.env;

if (!UCS_PROJECT_ID || !UCS_KEY_ID || !UCS_SECRET_KEY) {
  console.error("Faltan variables de entorno UCS_PROJECT_ID, UCS_KEY_ID, UCS_SECRET_KEY");
  process.exit(1);
}

// Auth básico para Admin APIs (KEY_ID:SECRET_KEY)
const basic = "Basic " + Buffer.from(`${UCS_KEY_ID}:${UCS_SECRET_KEY}`).toString("base64");
// Host típico de Cloud Save Admin API (ajústalo si tu doc indica otro)
const BASE = "https://cloud-save.services.api.unity.com";

// Lista ficheros del jugador
app.get("/files", async (req, res) => {
  try {
    const { playerId } = req.query;
    if (!playerId) return res.status(400).json({ error: "playerId requerido" });

    const url = `${BASE}/v1/projects/${UCS_PROJECT_ID}/players/${encodeURIComponent(playerId)}/files`;
    const r = await fetch(url, { headers: { Authorization: basic } });
    if (!r.ok) return res.status(r.status).json(await r.json()).end();
    const data = await r.json(); // [{key,size,contentType,updatedAt},...]
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// URL firmada de descarga (temporal)
app.get("/files/url", async (req, res) => {
  try {
    const { playerId, file } = req.query;
    if (!playerId || !file) return res.status(400).json({ error: "playerId y file requeridos" });

    const url = `${BASE}/v1/projects/${UCS_PROJECT_ID}/players/${encodeURIComponent(playerId)}/files/${encodeURIComponent(file)}/download-url`;
    const r = await fetch(url, { method: "POST", headers: { Authorization: basic } });
    if (!r.ok) return res.status(r.status).json(await r.json()).end();
    const data = await r.json(); // { url, expiresAt }
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Emparejar playerId con usuario WP usando un código de 6 dígitos (demo en memoria)
const codes = new Map(); // en producción usa Redis/DB

// Crear código (lo llama Unity)
app.post("/link/create", (req, res) => {
  const { playerId } = req.body || {};
  if (!playerId) return res.status(400).json({ error: "playerId requerido" });
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  codes.set(code, { playerId, expiresAt: Date.now() + 15 * 60 * 1000 }); // 15 min
  res.json({ code });
});

// Resolver código (lo llama WordPress)
app.post("/link/resolve", (req, res) => {
  const { code } = req.body || {};
  const item = codes.get(code);
  if (!item || item.expiresAt < Date.now()) {
    return res.status(404).json({ error: "Código inválido o expirado" });
  }
  codes.delete(code);
  res.json({ playerId: item.playerId });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Proxy escuchando en " + PORT));
