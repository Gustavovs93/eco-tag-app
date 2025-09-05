// cache-manager.js - Gestión de caché para optimizar peticiones
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.setupCacheCleanup();
    }
    
    async get(key, fetchFunction, ttl = 300000) {
        const cached = this.cache.get(key);
        
        // Verificar si hay datos en caché y si no han expirado
        if (cached && Date.now() - cached.timestamp < ttl) {
            return cached.data;
        }
        
        // Si no hay datos en caché o han expirado, hacer la petición
        const data = await fetchFunction();
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        return data;
    }
    
    clear(pattern = null) {
        if (!pattern) {
            this.cache.clear();
            return;
        }
        
        // Limpiar entradas que coincidan con el patrón (regex o string)
        for (const [key] of this.cache.entries()) {
            if (typeof pattern === 'string' && key.startsWith(pattern)) {
                this.cache.delete(key);
            } else if (pattern instanceof RegExp && pattern.test(key)) {
                this.cache.delete(key);
            }
        }
    }
    
    setupCacheCleanup() {
        // Limpiar caché expirada cada minuto
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.cache.entries()) {
                // Si no tenemos TTL específico, usar 5 minutos por defecto
                if (now - value.timestamp > (value.ttl || 300000)) {
                    this.cache.delete(key);
                }
            }
        }, 60000);
    }
}

// Hacer disponible globalmente
window.CacheManager = CacheManager;