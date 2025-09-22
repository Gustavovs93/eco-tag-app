// sw.js - Service Worker corregido
const CACHE_NAME = 'ecotag-v1';
const urlsToCache = [
  '/',
  '/index.html'
  // No incluir archivos que no existen todavía
];

self.addEventListener('install', event => {
  console.log('Service Worker instalando...');
  
  // Skip waiting para activación inmediata
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        // Solo cachear archivos que existen
        return cache.addAll([
          '/',
          '/index.html'
        ]).catch(error => {
          console.log('Error cacheando archivos:', error);
        });
      })
  );
});

self.addEventListener('fetch', event => {
  // Solo cachear solicitudes GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve el recurso cacheado o fetch normal
        return response || fetch(event.request);
      })
      .catch(error => {
        console.log('Error en fetch:', error);
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker activado');
  // Tomar control inmediato de todas las pestañas
  event.waitUntil(self.clients.claim());
});