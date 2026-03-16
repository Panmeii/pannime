const axios = require("axios");

const BASE_URL = "https://otakudesu.cloud";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    Referer: BASE_URL,
    "Cache-Control": "no-cache",
  },
});

/**
 * Fetch HTML dari URL yang diberikan
 * @param {string} path - path relatif atau URL penuh
 */
async function fetchPage(path) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const response = await client.get(url);
  return response.data;
}

module.exports = { fetchPage, BASE_URL };
