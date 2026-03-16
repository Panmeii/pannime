const cheerio = require("cheerio");
const { fetchPage, BASE_URL } = require("../utils/httpClient");

// ─── Helper ──────────────────────────────────────────────────────────────────

function cleanText(text) {
  return text ? text.trim().replace(/\s+/g, " ") : "";
}

function extractSlug(url = "") {
  // Ambil segment terakhir dari URL OtakuDesu
  const parts = url.replace(/\/$/, "").split("/");
  return parts[parts.length - 1] || "";
}

function toAbsoluteUrl(url = "") {
  if (!url) return "";
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
}

// ─── Scrapers ────────────────────────────────────────────────────────────────

/**
 * Halaman utama: anime terbaru + ongoing
 *
 * Struktur HTML (dari inspect element otakudesu.blog):
 * div#venkonten > div.vezone > div.venz > ul > li > div.detpost
 *   ├── div.epz        → "Episode 10"  (ada span icon di dalamnya, ambil teks saja)
 *   ├── div.epztipe    → "Senin"       (hari rilis)
 *   ├── div.newnime    → "16 Mar"      (tanggal update)
 *   └── div.thumb > a[href]            (link ke halaman anime)
 *         └── div.thumbz > img[src]   (thumbnail)
 *               (judul ada di attr title pada <a> atau di h2 di dalam thumbz)
 */
async function scrapeHome() {
  const html = await fetchPage("/");
  const $ = cheerio.load(html);

  const latest = [];

  // Selector utama sesuai struktur: div.venz > ul > li
  $(".venz ul li").each((_, el) => {
    const $el = $(el);

    // Judul: cek berbagai kemungkinan posisi
    const title =
      cleanText($el.find(".thumbz h2").text()) ||
      cleanText($el.find(".thumb a").attr("title")) ||
      cleanText($el.find("h2").text()) ||
      "";

    // Link anime
    const url = $el.find(".thumb a").attr("href") || $el.find("a").first().attr("href") || "";

    // Thumbnail
    const image =
      $el.find(".thumbz img").attr("src") ||
      $el.find("img").attr("src") ||
      $el.find("img").attr("data-src") ||
      "";

    // Episode: div.epz berisi span icon + teks " Episode 10"
    // cleanText akan bersihkan whitespace berlebih
    const episode = cleanText($el.find(".epz").text());

    // Hari rilis: div.epztipe (ada icon fa-star + teks " Senin")
    const day = cleanText($el.find(".epztipe").text());

    // Tanggal update: div.newnime → "16 Mar"
    const date = cleanText($el.find(".newnime").text());

    if (title && url) {
      latest.push({ title, slug: extractSlug(url), url, image, latest_episode: episode, day, date });
    }
  });

  return {
    latest_updates: latest,
    total: latest.length,
  };
}

/**
 * Search anime
 */
async function scrapeSearch(query) {
  const html = await fetchPage(`/?s=${encodeURIComponent(query)}&post_type=anime`);
  const $ = cheerio.load(html);

  const results = [];

  $(".chivsrc ul li").each((_, el) => {
    const title = cleanText($(el).find("h2 a").text());
    const url = $(el).find("h2 a").attr("href") || "";
    const image = $(el).find("img").attr("src") || $(el).find("img").attr("data-src") || "";
    const genres = [];
    $(el)
      .find(".set a")
      .each((_, g) => genres.push(cleanText($(g).text())));
    const status = cleanText($(el).find(".set").last().text().replace("Status :", ""));

    if (title && url) {
      results.push({ title, slug: extractSlug(url), url, image, genres, status });
    }
  });

  return { query, total: results.length, results };
}

/**
 * Detail anime (info lengkap + daftar episode)
 */
async function scrapeAnimeDetail(slug) {
  const html = await fetchPage(`/anime/${slug}/`);
  const $ = cheerio.load(html);

  const title = cleanText($(".infoanime h1, .entry-title").first().text());
  const image = $(".fotoanime img").attr("src") || $(".fotoanime img").attr("data-src") || "";
  const synopsis = cleanText($(".sinopc, .sinn").text());

  // Info detail (tabel)
  const info = {};
  $(".infoanime .infozin .infozingle, .infoanime table tr").each((_, row) => {
    const b = cleanText($(row).find("b").text().replace(":", "")).toLowerCase();
    const val = cleanText(
      $(row).find("span, td").last().text()
    );
    if (b && val) info[b] = val;
  });

  // Genre
  const genres = [];
  $(".infoanime .infozin .infozingle a, .genre-info a").each((_, el) => {
    const g = cleanText($(el).text());
    if (g) genres.push(g);
  });

  // Episode list
  const episodes = [];
  $(".episodelist ul li, #venkonten ul li").each((_, el) => {
    const epTitle = cleanText($(el).find("a").text());
    const epUrl = $(el).find("a").attr("href") || "";
    const epDate = cleanText($(el).find(".zeebr").text());
    if (epTitle && epUrl) {
      episodes.push({
        title: epTitle,
        slug: extractSlug(epUrl),
        url: epUrl,
        date: epDate,
      });
    }
  });

  return {
    title,
    slug,
    url: `${BASE_URL}/anime/${slug}/`,
    image,
    synopsis,
    info,
    genres,
    total_episodes: episodes.length,
    episodes,
  };
}

/**
 * Detail episode: streaming links + download links
 */
async function scrapeEpisode(slug) {
  // Coba beberapa pola URL episode OtakuDesu
  const urlsToTry = [
    `/${slug}/`,
    `/episode/${slug}/`,
  ];

  let html = null;
  let usedUrl = "";

  for (const path of urlsToTry) {
    try {
      html = await fetchPage(path);
      usedUrl = `${BASE_URL}${path}`;
      break;
    } catch {
      // coba URL berikutnya
    }
  }

  if (!html) throw new Error(`Episode "${slug}" tidak ditemukan`);

  const $ = cheerio.load(html);

  const title = cleanText($(".postbody h1, .entry-title").first().text());

  // Navigasi episode
  const prevEp = $(".naveps .bpreve a").attr("href") || null;
  const nextEp = $(".naveps .bnexte a").attr("href") || null;

  // Streaming sources (iframe / server)
  const streamingSources = [];
  $(".mirrorstream ul li, .streaminh ul li").each((_, el) => {
    const serverName = cleanText($(el).find("a span, a").first().text());
    const dataContent = $(el).find("a").attr("data-content") || "";
    // decode base64 jika ada
    let iframeUrl = "";
    try {
      iframeUrl = dataContent ? Buffer.from(dataContent, "base64").toString("utf-8") : "";
      const iframeMatch = iframeUrl.match(/src=["']([^"']+)["']/);
      if (iframeMatch) iframeUrl = iframeMatch[1];
    } catch {
      iframeUrl = dataContent;
    }
    if (serverName) {
      streamingSources.push({ server: serverName, url: iframeUrl || dataContent });
    }
  });

  // Jika metode di atas kosong, ambil iframe langsung
  if (streamingSources.length === 0) {
    $("iframe").each((_, el) => {
      const src = $(el).attr("src") || "";
      if (src) streamingSources.push({ server: "Default", url: src });
    });
  }

  // Download links
  const downloadLinks = [];
  $(".download ul li, .downloaddiv ul li").each((_, li) => {
    const quality = cleanText($(li).find("strong, b").text());
    const links = [];
    $(li)
      .find("a")
      .each((_, a) => {
        const host = cleanText($(a).text());
        const url = $(a).attr("href") || "";
        const size = cleanText($(a).attr("title") || "");
        if (host && url) links.push({ host, url, size });
      });
    if (links.length) downloadLinks.push({ quality, links });
  });

  return {
    title,
    slug,
    url: usedUrl,
    prev_episode: prevEp ? { slug: extractSlug(prevEp), url: prevEp } : null,
    next_episode: nextEp ? { slug: extractSlug(nextEp), url: nextEp } : null,
    streaming_sources: streamingSources,
    download_links: downloadLinks,
  };
}

/**
 * Daftar genre
 */
async function scrapeGenres() {
  const html = await fetchPage("/genre-list/");
  const $ = cheerio.load(html);

  const genres = [];
  $(".genres ul li a, .genre-list a").each((_, el) => {
    const name = cleanText($(el).text());
    const url = $(el).attr("href") || "";
    if (name && url) {
      genres.push({ name, slug: extractSlug(url), url });
    }
  });

  return { total: genres.length, genres };
}

/**
 * Anime by genre
 */
async function scrapeByGenre(genre, page = 1) {
  const path = page > 1 ? `/genres/${genre}/page/${page}/` : `/genres/${genre}/`;
  const html = await fetchPage(path);
  const $ = cheerio.load(html);

  const animes = [];
  $(".page .col-anime, .animepost, .animposx").each((_, el) => {
    const title = cleanText($(el).find(".title, h2").text());
    const url = $(el).find("a").first().attr("href") || "";
    const image = $(el).find("img").attr("src") || $(el).find("img").attr("data-src") || "";
    const status = cleanText($(el).find(".tipe, .type").text());
    const score = cleanText($(el).find(".score, .rating").text());
    if (title && url) {
      animes.push({ title, slug: extractSlug(url), url, image, status, score });
    }
  });

  const hasNext = $(".hpage .r").length > 0;

  return {
    genre,
    page: Number(page),
    has_next_page: hasNext,
    total: animes.length,
    results: animes,
  };
}

/**
 * Jadwal rilis anime
 */
async function scrapeSchedule() {
  const html = await fetchPage("/jadwal-rilis/");
  const $ = cheerio.load(html);

  const schedule = {};
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  $(".kglist321").each((_, dayBlock) => {
    const dayName = cleanText($(dayBlock).find("h2").text());
    const animes = [];
    $(dayBlock)
      .find("ul li")
      .each((_, li) => {
        const title = cleanText($(li).find("a").text());
        const url = $(li).find("a").attr("href") || "";
        if (title) animes.push({ title, slug: extractSlug(url), url });
      });
    if (dayName && animes.length) schedule[dayName] = animes;
  });

  return { schedule };
}

/**
 * Ongoing anime list
 *
 * Struktur sama dengan home: div.venz > ul > li > div.detpost
 *   ├── div.epz     → episode terbaru
 *   ├── div.epztipe → hari rilis
 *   ├── div.newnime → tanggal
 *   └── div.thumb > a + div.thumbz > img
 */
async function scrapeOngoing(page = 1) {
  const path = page > 1 ? `/ongoing-anime/page/${page}/` : `/ongoing-anime/`;
  const html = await fetchPage(path);
  const $ = cheerio.load(html);

  const animes = [];
  $(".venz ul li").each((_, el) => {
    const $el = $(el);
    const title =
      cleanText($el.find(".thumbz h2").text()) ||
      cleanText($el.find(".thumb a").attr("title")) ||
      "";
    const url  = $el.find(".thumb a").attr("href") || $el.find("a").first().attr("href") || "";
    const image = $el.find(".thumbz img").attr("src") || $el.find("img").attr("src") || $el.find("img").attr("data-src") || "";
    const episode = cleanText($el.find(".epz").text());
    const day     = cleanText($el.find(".epztipe").text());
    const date    = cleanText($el.find(".newnime").text());
    if (title && url) {
      animes.push({ title, slug: extractSlug(url), url, image, latest_episode: episode, day, date });
    }
  });

  const hasNext = $(".hpage .r").length > 0;

  return { page: Number(page), has_next_page: hasNext, total: animes.length, results: animes };
}

/**
 * Completed anime list
 */
async function scrapeCompleted(page = 1) {
  const path = page > 1 ? `/complete-anime/page/${page}/` : `/complete-anime/`;
  const html = await fetchPage(path);
  const $ = cheerio.load(html);

  const animes = [];
  $(".venz ul li, .animposx").each((_, el) => {
    const title = cleanText($(el).find(".thumbz h2, h2, .title").text());
    const url = $(el).find("a").first().attr("href") || "";
    const image = $(el).find("img").attr("src") || $(el).find("img").attr("data-src") || "";
    const score = cleanText($(el).find(".score, .rating").text());
    if (title && url) {
      animes.push({ title, slug: extractSlug(url), url, image, score });
    }
  });

  const hasNext = $(".hpage .r").length > 0;

  return { page: Number(page), has_next_page: hasNext, total: animes.length, results: animes };
}

module.exports = {
  scrapeHome,
  scrapeSearch,
  scrapeAnimeDetail,
  scrapeEpisode,
  scrapeGenres,
  scrapeByGenre,
  scrapeSchedule,
  scrapeOngoing,
  scrapeCompleted,
};
