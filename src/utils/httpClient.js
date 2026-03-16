const puppeteer = require("puppeteer");

const BASE_URL = "https://otakudesu.blog";

// ─── Browser Pool ────────────────────────────────────────────────────────────
// Satu instance browser dipakai ulang agar tidak buka/tutup Chrome tiap request
let browserInstance = null;

async function getBrowser() {
  if (browserInstance && browserInstance.connected) return browserInstance;

  browserInstance = await puppeteer.launch({
    headless: "new",          // headless mode terbaru (tidak buka window)
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",  // penting untuk VPS/Linux memory kecil
      "--disable-gpu",
      "--window-size=1280,800",
    ],
  });

  // Auto-restart jika browser crash
  browserInstance.on("disconnected", () => {
    browserInstance = null;
  });

  console.log("[Puppeteer] Browser launched ✅");
  return browserInstance;
}

// ─── Stealth Headers ─────────────────────────────────────────────────────────
// Tambahkan header agar terlihat seperti browser biasa
async function applyStealthHeaders(page) {
  await page.setExtraHTTPHeaders({
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
  });

  // Override navigator properties agar tidak ketahuan sebagai headless
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });
    Object.defineProperty(navigator, "languages", { get: () => ["id-ID", "id", "en-US"] });
    window.chrome = { runtime: {} };
  });
}

// ─── Main Fetch ──────────────────────────────────────────────────────────────
/**
 * Buka URL dengan Puppeteer dan kembalikan HTML setelah halaman selesai load
 * @param {string} path - path relatif (contoh: "/") atau URL penuh
 * @param {Object} options
 * @param {number} options.waitMs - tambahan delay setelah load (ms), default 500
 * @param {string} options.waitUntil - kapan dianggap selesai load, default "domcontentloaded"
 */
async function fetchPage(path, { waitMs = 500, waitUntil = "domcontentloaded" } = {}) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set viewport seperti desktop biasa
    await page.setViewport({ width: 1280, height: 800 });

    // Set User-Agent Chrome nyata
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    await applyStealthHeaders(page);

    // Blokir resource tidak penting (gambar, font, media) untuk mempercepat
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "media", "font", "stylesheet"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil, timeout: 20000 });

    // Tunggu sebentar agar JS selesai render (jika ada dynamic content)
    if (waitMs > 0) {
      await new Promise((r) => setTimeout(r, waitMs));
    }

    const html = await page.content();
    return html;
  } finally {
    // Selalu tutup page setelah selesai agar tidak memory leak
    await page.close();
  }
}

/**
 * Tutup browser (panggil saat server shutdown)
 */
async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    console.log("[Puppeteer] Browser closed");
  }
}

module.exports = { fetchPage, closeBrowser, BASE_URL };
