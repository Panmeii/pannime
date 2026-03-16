const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const animeRoutes = require("./routes/anime");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security & Middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting: 60 req / menit per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    status: 429,
    message: "Terlalu banyak request, coba lagi setelah 1 menit.",
  },
});
app.use(limiter);

// ─── Routes ─────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    name: "OtakuDesu API",
    version: "1.0.0",
    description: "Unofficial REST API untuk OtakuDesu",
    endpoints: {
      home: "GET /api/v1/anime/home",
      search: "GET /api/v1/anime/search?q={query}",
      detail: "GET /api/v1/anime/:slug",
      episodes: "GET /api/v1/anime/:slug/episodes",
      episode: "GET /api/v1/anime/episode/:slug",
      genres: "GET /api/v1/anime/genres",
      byGenre: "GET /api/v1/anime/genre/:genre?page={page}",
      schedule: "GET /api/v1/anime/schedule",
      ongoing: "GET /api/v1/anime/ongoing?page={page}",
      completed: "GET /api/v1/anime/completed?page={page}",
    },
  });
});

app.use("/api/v1/anime", animeRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 OtakuDesu API berjalan di http://localhost:${PORT}`);
  console.log(`📖 Dokumentasi: http://localhost:${PORT}\n`);
});

module.exports = app;
