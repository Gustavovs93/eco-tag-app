// api.js - Servicio para conexión con backend
class EcoTagAPI {
    constructor() {
        this.baseURL = window.APP_CONFIG.apiUrl;
        this.authToken = localStorage.getItem('authToken');
        this.cacheManager = new CacheManager();
    }

    // Establecer el token de autenticación
    setAuthToken(token) {
        this.authToken = token;
        localStorage.setItem('authToken', token);
    }

    // Eliminar el token de autenticación
    removeAuthToken() {
        this.authToken = null;
        localStorage.removeItem('authToken');
    }

    // Método genérico para realizar peticiones
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        const config = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                // Token expirado o inválido
                this.removeAuthToken();
                window.location.href = 'index.html';
                throw new Error('Sesión expirada');
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            
            // Notificar al sistema de monitoreo de errores
            if (window.errorMonitor) {
                window.errorMonitor.captureException(error);
            }
            
            throw error;
        }
    }

    // ===== AUTENTICACIÓN =====
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async logout() {
        return this.request('/auth/logout', {
            method: 'POST',
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    // ===== PRODUCTOS =====
    async getProducts(params = {}) {
        const cacheKey = `products_${JSON.stringify(params)}`;
        return this.cacheManager.get(cacheKey, () => {
            const queryString = new URLSearchParams(params).toString();
            return this.request(`/products?${queryString}`);
        }, 300000); // Cache por 5 minutos
    }

    async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    async createProduct(productData) {
        // Invalidar caché de productos
        this.cacheManager.clear(/^products_/);
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData),
        });
    }

    // ===== ESCANEOS =====
    async getScans(params = {}) {
        const cacheKey = `scans_${JSON.stringify(params)}`;
        return this.cacheManager.get(cacheKey, () => {
            const queryString = new URLSearchParams(params).toString();
            return this.request(`/scans?${queryString}`);
        }, 60000); // Cache por 1 minuto
    }

    async createScan(scanData) {
        // Invalidar caché de escaneos
        this.cacheManager.clear(/^scans_/);
        return this.request('/scans', {
            method: 'POST',
            body: JSON.stringify(scanData),
        });
    }

    // ===== CERTIFICACIONES =====
    async getCertifications(params = {}) {
        const cacheKey = `certs_${JSON.stringify(params)}`;
        return this.cacheManager.get(cacheKey, () => {
            const queryString = new URLSearchParams(params).toString();
            return this.request(`/certifications?${queryString}`);
        }, 300000); // Cache por 5 minutos
    }

    async createCertification(certificationData) {
        return this.request('/certifications', {
            method: 'POST',
            body: JSON.stringify(certificationData),
        });
    }

    // ===== REPORTES =====
    async generateReport(reportData) {
        return this.request('/reports/generate', {
            method: 'POST',
            body: JSON.stringify(reportData),
        });
    }
}

// Instancia global de la API
window.ecoTagAPI = new EcoTagAPI();