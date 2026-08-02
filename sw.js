/* ==========================================================================
   ALMAZ WATCH — sw.js (Service Worker)
   Кеширует "оболочку" сайта (HTML/CSS/JS/иконку), чтобы сайт открывался
   даже при слабом или отсутствующем интернете. Данные из Supabase
   (товары, отзывы) не кешируются здесь — за них отвечает localStorage
   в app.js, это разные уровни кеша.
   ========================================================================== */

const CACHE_NAME = 'almaz-watch-shell-v1';

const SHELL_FILES = [
  '/index.html',
  '/catalog.html',
  '/reviews.html',
  '/about.html',
  '/contacts.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon.svg',
];

// При установке — сохраняем оболочку сайта в кеш
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {
      /* Если какой-то файл недоступен при установке — не блокируем весь SW */
    })
  );
  self.skipWaiting();
});

// При активации — удаляем старые версии кеша
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Стратегия: сначала сеть (чтобы контент был свежим), при отсутствии сети — кеш
self.addEventListener('fetch', (event) => {
  // Запросы к Supabase (API) НЕ кешируем через SW — там своя логика в app.js
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

