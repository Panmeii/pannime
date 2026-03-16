const scraper = require("../scrapers/otakudesu");
const { getOrSet } = require("../utils/cache");

function respond(res, data) {
  res.json({ status: "ok", data });
}

function handleError(res, err) {
  console.error("[Error]", err.message);
  const status = err.response?.status || 500;
  res.status(status).json({
    status: "error",
    message: err.message || "Terjadi kesalahan saat mengambil data",
  });
}

// GET /home
async function getHome(req, res) {
  try {
    const data = await getOrSet("home", () => scraper.scrapeHome(), 300);
    respond(res, data);
  } catch (err) {
    handleError(res, err);
  }
}

// GET /search?q=
async function searchAnime(req, res) {
  const q = req.query.q?.trim();
  if (!q) return res.status(400).json({ status: "error", message: "Parameter 'q' diperlukan" });
  try {
    const data = await getOrSet(`search:${q}`, () => scraper.scrapeSearch(q), 180);
    respond(res, data);
  } catch (err) {
    handleError(res, err);
  }
}

// GET /:slug (detail anime)
async function getAnimeDetail(req, res) {
  const { slug } = req.params;
  try {
    const data = await getOrSet(`anime:${slug}`, () => scraper.scrapeAnimeDetail(slug), 600);
    respond(res, data);
  } catch (err) {
    handleError(res, err);
  }
}

// GET /:slug/episodes
async function getEpisodeList(req, res) {
  const { slug } = req.params;
  try {
    const data = await getOrSet(`anime:${slug}`, () => scraper.scrapeAnimeDetail(slug), 600);
    respond(res, { slug, total_episodes: data.total_episodes, episodes: data.episodes });
  } catch (err) {
    handleError(res, err);
  }
}

// GET /episode/:slug
async function getEpisodeDetail(req, res) {
  const { slug } = req.params;
  try {
    const data = await getOrSet(`episode:${slug}`, () => scraper.scrapeEpisode(slug), 300);
    respond(res, data);
  } catch (err) {
    handleError(res, err);
  }
}

// GET /genres
async function getGenres(req, res) {
  try {
    const data = await getOrSet("genres", () => scraper.scrapeGenres(), 3600);
    respond(res, data);
  } catch (err) {
    handleError(res, err);
  }
}

// GET /genre/:genre?page=
async function getByGenre(req, res) {
  const { genre } = req.params;
  const page = parseInt(req.query.page) || 1;
  try {
    const data = await getOrSet(`genre:${genre}:${page}`, () => scraper.scrapeByGenre(genre, page), 600);
    respond(res, data);
  } catch (err) {
    handleError(res, err);
  }
}

// GET /schedule
async function getSchedule(req, res) {
  try {
    const data = await getOrSet("schedule", () => scraper.scrapeSchedule(), 3600);
    respond(res, data);
  } catch (err) {
    handleError(res, err);
  }
}

// GET /ongoing?page=
async function getOngoing(req, res) {
  const page = parseInt(req.query.page) || 1;
  try {
    const data = await getOrSet(`ongoing:${page}`, () => scraper.scrapeOngoing(page), 300);
    respond(res, data);
  } catch (err) {
    handleError(res, err);
  }
}

// GET /completed?page=
async function getCompleted(req, res) {
  const page = parseInt(req.query.page) || 1;
  try {
    const data = await getOrSet(`completed:${page}`, () => scraper.scrapeCompleted(page), 600);
    respond(res, data);
  } catch (err) {
    handleError(res, err);
  }
}

module.exports = {
  getHome,
  searchAnime,
  getAnimeDetail,
  getEpisodeList,
  getEpisodeDetail,
  getGenres,
  getByGenre,
  getSchedule,
  getOngoing,
  getCompleted,
};
