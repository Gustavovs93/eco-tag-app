// CacheManager.js - Gestor de caché para la API
class CacheManager {
    constructor() {
        this.cache = new Map();
    }

    get(key, fetcher, ttl = 60000) {
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < ttl) {
            return Promise.resolve(cached.data);
        }
        
        return fetcher().then(data => {
            this.cache.set(key, {
                data,
                timestamp: Date.now()
            });
            return data;
        });
    }

    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clear(pattern = null) {
        if (pattern instanceof RegExp) {
            for (const key of this.cache.keys()) {
                if (pattern.test(key)) {
                    this.cache.delete(key);
                }
            }
        } else if (pattern) {
            this.cache.delete(pattern);
        } else {
            this.cache.clear();
        }
    }

    // Limpiar caché expirada
    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > 300000) { // 5 minutos
                this.cache.delete(key);
            }
        }
    }
}

// Ejecutar limpieza cada minuto
setInterval(() => {
    if (window.cacheManager) {
        window.cacheManager.cleanup();
    }
}, 60000);

window.CacheManager = CacheManager;