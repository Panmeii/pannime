# 🎌 OtakuDesu API

Unofficial REST API untuk crawl data anime dari [OtakuDesu](https://otakudesu.cloud).  
Dibangun dengan **Node.js + Express + Cheerio**.

---

## 🚀 Instalasi

```bash
# Clone / copy project
cd otakudesu-api

# Install dependencies
npm install

# Jalankan development (hot-reload)
npm run dev

# Atau production
npm start
```

Server berjalan di `http://localhost:3000`

---

## 📌 Base URL

```
http://localhost:3000/api/v1/anime
```

---

## 📖 Endpoint

### 🏠 Home — Update Terbaru
```
GET /api/v1/anime/home
```
**Response:**
```json
{
  "status": "ok",
  "data": {
    "latest_updates": [
      {
        "title": "Naruto",
        "slug": "naruto-sub-indo",
        "url": "https://otakudesu.cloud/anime/naruto-sub-indo/",
        "image": "https://...",
        "latest_episode": "Episode 220",
        "day": "Senin"
      }
    ],
    "ongoing": [ ... ]
  }
}
```

---

### 🔍 Search Anime
```
GET /api/v1/anime/search?q={query}
```
**Contoh:** `/api/v1/anime/search?q=one+piece`

**Response:**
```json
{
  "status": "ok",
  "data": {
    "query": "one piece",
    "total": 5,
    "results": [
      {
        "title": "One Piece",
        "slug": "one-piece-sub-indo",
        "url": "...",
        "image": "...",
        "genres": ["Action", "Adventure"],
        "status": "Ongoing"
      }
    ]
  }
}
```

---

### 📺 Detail Anime
```
GET /api/v1/anime/:slug
```
**Contoh:** `/api/v1/anime/one-piece-sub-indo`

**Response:**
```json
{
  "status": "ok",
  "data": {
    "title": "One Piece",
    "slug": "one-piece-sub-indo",
    "image": "...",
    "synopsis": "...",
    "info": {
      "judul": "One Piece",
      "japanese": "ワンピース",
      "skor": "8.7",
      "produser": "Fuji TV",
      "tipe": "TV",
      "status": "Ongoing",
      "total episode": "1100+"
    },
    "genres": ["Action", "Adventure", "Comedy"],
    "total_episodes": 1100,
    "episodes": [ ... ]
  }
}
```

---

### 📋 Daftar Episode Anime
```
GET /api/v1/anime/:slug/episodes
```
**Contoh:** `/api/v1/anime/one-piece-sub-indo/episodes`

---

### ▶️ Detail Episode (Streaming + Download)
```
GET /api/v1/anime/episode/:slug
```
**Contoh:** `/api/v1/anime/episode/one-piece-episode-1100-sub-indo`

**Response:**
```json
{
  "status": "ok",
  "data": {
    "title": "One Piece Episode 1100",
    "slug": "...",
    "prev_episode": { "slug": "...", "url": "..." },
    "next_episode": { "slug": "...", "url": "..." },
    "streaming_sources": [
      { "server": "Desu1", "url": "https://..." },
      { "server": "Desu2", "url": "https://..." }
    ],
    "download_links": [
      {
        "quality": "480p",
        "links": [
          { "host": "GDrive", "url": "https://...", "size": "120MB" },
          { "host": "ZippyShare", "url": "https://..." }
        ]
      },
      {
        "quality": "720p",
        "links": [ ... ]
      }
    ]
  }
}
```

---

### 🏷️ Daftar Genre
```
GET /api/v1/anime/genres
```

---

### 📂 Anime by Genre
```
GET /api/v1/anime/genre/:genre?page={page}
```
**Contoh:** `/api/v1/anime/genre/action?page=1`

---

### 📅 Jadwal Rilis
```
GET /api/v1/anime/schedule
```
**Response:**
```json
{
  "status": "ok",
  "data": {
    "schedule": {
      "Senin": [ { "title": "...", "slug": "..." } ],
      "Selasa": [ ... ],
      ...
    }
  }
}
```

---

### 🔄 Ongoing Anime
```
GET /api/v1/anime/ongoing?page={page}
```

---

### ✅ Completed Anime
```
GET /api/v1/anime/completed?page={page}
```

---

## ⚡ Fitur

| Fitur | Keterangan |
|-------|-----------|
| ✅ Caching | Data di-cache 5–60 menit untuk hemat request |
| ✅ Rate Limiting | Max 60 req/menit per IP |
| ✅ Error Handling | Semua error dikembalikan dalam format JSON |
| ✅ CORS | Bisa diakses dari frontend manapun |
| ✅ Helmet | Security headers otomatis |

---

## 🏗️ Struktur Project

```
otakudesu-api/
├── src/
│   ├── index.js                 # Entry point, setup Express
│   ├── routes/
│   │   └── anime.js             # Definisi semua route
│   ├── controllers/
│   │   └── animeController.js   # Logic request/response
│   ├── scrapers/
│   │   └── otakudesu.js         # Semua logic crawling
│   ├── middleware/
│   │   └── errorHandler.js      # Error & 404 handler
│   └── utils/
│       ├── httpClient.js        # Axios instance dengan headers
│       └── cache.js             # In-memory caching
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## ⚠️ Disclaimer

API ini dibuat untuk keperluan pembelajaran. Semua konten adalah milik OtakuDesu.
