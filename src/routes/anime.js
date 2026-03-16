const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/animeController");

// ─── Routes ──────────────────────────────────────────────────────────────────
// URUTAN PENTING: route statis harus di atas route dinamis (:slug)

router.get("/home",          ctrl.getHome);
router.get("/search",        ctrl.searchAnime);
router.get("/genres",        ctrl.getGenres);
router.get("/genre/:genre",  ctrl.getByGenre);
router.get("/schedule",      ctrl.getSchedule);
router.get("/ongoing",       ctrl.getOngoing);
router.get("/completed",     ctrl.getCompleted);
router.get("/episode/:slug", ctrl.getEpisodeDetail);

// Dynamic routes (harus paling bawah)
router.get("/:slug/episodes", ctrl.getEpisodeList);
router.get("/:slug",          ctrl.getAnimeDetail);

module.exports = router;
