const NodeCache = require("node-cache");

// TTL default: 10 menit
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

/**
 * Ambil data dari cache atau jalankan fungsi fetcher
 * @param {string} key - cache key unik
 * @param {Function} fetcher - async function yang mengembalikan data
 * @param {number} ttl - time-to-live dalam detik (opsional)
 */
async function getOrSet(key, fetcher, ttl = 600) {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const data = await fetcher();
  cache.set(key, data, ttl);
  return data;
}

function invalidate(key) {
  cache.del(key);
}

function flush() {
  cache.flushAll();
}

module.exports = { getOrSet, invalidate, flush };
