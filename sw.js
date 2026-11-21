// Service worker: działanie offline. Każda zmiana plików przy wdrożeniu = podbij WERSJA.
const WERSJA = '1';
const NAZWA_CACHE = `wycena-ciast-v${WERSJA}`;
const PLIKI = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'fonts/lexend-latin.woff2',
  'fonts/lexend-latin-ext.woff2',
  'ikony/ikona-180.png',
  'ikony/ikona-192.png',
  'ikony/ikona-512.png',
  'js/app.js',
  'js/dane.js',
  'js/demo.js',
  'js/kopia.js',
  'js/liczby.js',
  'js/magazyn.js',
  'js/obliczenia.js',
  'js/ui.js',
  'js/ekrany/ciasta.js',
  'js/ekrany/ciasto.js',
  'js/ekrany/edycja.js',
  'js/ekrany/skladniki.js',
  'js/ekrany/ustawienia.js',
];

self.addEventListener('install', (zdarzenie) => {
  zdarzenie.waitUntil(
    caches.open(NAZWA_CACHE).then((cache) => cache.addAll(PLIKI.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (zdarzenie) => {
  zdarzenie.waitUntil(
    caches.keys()
      .then((nazwy) => Promise.all(nazwy.filter((n) => n !== NAZWA_CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (zdarzenie) => {
  const zadanie = zdarzenie.request;
  if (zadanie.method !== 'GET' || new URL(zadanie.url).origin !== self.location.origin) return;
  zdarzenie.respondWith(
    caches.match(zadanie, { ignoreSearch: true }).then((trafienie) => trafienie || fetch(zadanie)),
  );
});
