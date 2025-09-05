// api-mock.js - Simulador de backend para desarrollo
class EcoTagAPIMock {
    constructor() {
        this.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        this.users = JSON.parse(localStorage.getItem('api_users') || '[]');
        this.products = JSON.parse(localStorage.getItem('api_products') || '[]');
        this.scans = JSON.parse(localStorage.getItem('api_scans') || '[]');
        this.certifications = JSON.parse(localStorage.getItem('api_certifications') || '[]');
        
        // Datos de ejemplo si no hay datos
        if (this.users.length === 0) {
            this.users = [
                {
                    id: "user_123456",
                    email: "demo@ecotag.com",
                    password: "password123",
                    company: "Empresa Demo",
                    plan: "professional",
                    createdAt: new Date().toISOString()
                }
            ];
            this.saveUsers();
        }
    }

    // Métodos de guardado
    saveUsers() {
        localStorage.setItem('api_users', JSON.stringify(this.users));
    }

    saveProducts() {
        localStorage.setItem('api_products', JSON.stringify(this.products));
    }

    saveScans() {
        localStorage.setItem('api_scans', JSON.stringify(this.scans));
    }

    saveCertifications() {
        localStorage.setItem('api_certifications', JSON.stringify(this.certifications));
    }

    // Simular retraso de red
    async simulateNetwork() {
        await this.delay(500 + Math.random() * 1000);
    }

    // Generar ID único
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // ===== AUTENTICACIÓN =====
    async login(email, password) {
        await this.simulateNetwork();
        
        const user = this.users.find(u => u.email === email && u.password === password);
        if (!user) {
            throw new Error('Credenciales inválidas');
        }

        // Eliminar password de la respuesta
        const { password: _, ...userWithoutPassword } = user;
        
        // Generar token
        const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({
            userId: user.id,
            email: user.email,
            exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
        }))}.${this.generateId()}`;

        return {
            success: true,
            data: {
                user: userWithoutPassword,
                token
            }
        };
    }

    async register(userData) {
        await this.simulateNetwork();

        // Validaciones
        if (!userData.email || !userData.password || !userData.company) {
            throw new Error('Todos los campos son obligatorios');
        }

        if (userData.password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        if (userData.password !== userData.confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }

        if (this.users.find(user => user.email === userData.email)) {
            throw new Error('El usuario ya existe');
        }

        // Crear nuevo usuario
        const newUser = {
            id: `user_${this.generateId()}`,
            email: userData.email,
            password: userData.password,
            company: userData.company,
            plan: userData.plan || "basic",
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers();

        // Eliminar password de la respuesta
        const { password: _, ...userWithoutPassword } = newUser;
        
        // Generar token
        const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({
            userId: newUser.id,
            email: newUser.email,
            exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
        }))}.${this.generateId()}`;

        return {
            success: true,
            data: {
                user: userWithoutPassword,
                token
            }
        };
    }

    async getCurrentUser() {
        await this.simulateNetwork();
        
        // En una implementación real, verificaríamos el token
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            throw new Error('No autenticado');
        }

        try {
            // Decodificar el token (simulado)
            const payload = authToken.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            const user = this.users.find(u => u.id === decoded.userId);
            
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Eliminar password de la respuesta
            const { password: _, ...userWithoutPassword } = user;
            
            return {
                success: true,
                data: userWithoutPassword
            };
        } catch (error) {
            throw new Error('Token inválido');
        }
    }

    // ===== PRODUCTOS =====
    async getProducts(params = {}) {
        await this.simulateNetwork();
        
        let filteredProducts = [...this.products];
        
        // Aplicar filtros
        if (params.search) {
            const searchTerm = params.search.toLowerCase();
            filteredProducts = filteredProducts.filter(product => 
                product.name.toLowerCase().includes(searchTerm) || 
                product.category.toLowerCase().includes(searchTerm)
            );
        }
        
        if (params.category) {
            filteredProducts = filteredProducts.filter(product => 
                product.category === params.category
            );
        }

        return {
            success: true,
            data: {
                products: filteredProducts,
                total: filteredProducts.length,
                page: parseInt(params.page) || 1,
                limit: parseInt(params.limit) || 10
            }
        };
    }

    async createProduct(productData) {
        await this.simulateNetwork();
        
        if (!productData.name || !productData.category) {
            throw new Error('Nombre y categoría son obligatorios');
        }

        const newProduct = {
            id: `prod_${this.generateId()}`,
            ...productData,
            sustainability_score: Math.floor(Math.random() * 30) + 60,
            created_at: new Date().toISOString(),
            last_scan: null,
            status: 'active'
        };

        this.products.push(newProduct);
        this.saveProducts();

        return {
            success: true,
            data: {
                product: newProduct
            }
        };
    }

    // ===== ESCANEOS =====
    async createScan(scanData) {
        await this.simulateNetwork();
        
        // Buscar o crear producto
        let product = this.products.find(p => p.id === scanData.product_id);
        
        if (!product) {
            product = {
                id: scanData.product_id || `prod_${this.generateId()}`,
                name: "Producto Escaneado",
                category: "General",
                sustainability_score: 75,
                created_at: new Date().toISOString(),
                last_scan: null
            };
            this.products.push(product);
            this.saveProducts();
        }

        // Registrar escaneo
        const newScan = {
            id: `scan_${this.generateId()}`,
            product: {
                id: product.id,
                name: product.name,
                category: product.category
            },
            sustainability_score: 75,
            environmental_impact: {
                carbon_footprint: `${Math.floor(Math.random() * 100 + 50)}g CO2e`,
                water_usage: `${Math.floor(Math.random() * 200 + 100)}ml`,
                energy_consumption: `${(Math.random() * 0.5 + 0.5).toFixed(1)}MJ`
            },
            improvement_recommendations: [
                {
                    category: "Materiales",
                    suggestion: "Aumentar contenido reciclado al 80%",
                    impact: "Reducción de 15% en huella de carbono"
                },
                {
                    category: "Manufactura",
                    suggestion: "Optimizar proceso de moldeo",
                    impact: "Reducción de 10% en consumo energético"
                }
            ],
            comparison: {
                industry_average: 62,
                best_in_class: 92
            },
            scanned_at: new Date().toISOString()
        };

        this.scans.push(newScan);
        this.saveScans();

        // Actualizar último escaneo del producto
        product.last_scan = new Date().toISOString();
        this.saveProducts();

        return {
            success: true,
            data: newScan
        };
    }

    // ===== CERTIFICACIONES =====
    async getCertifications(params = {}) {
        await this.simulateNetwork();
        
        let filteredCerts = [...this.certifications];
        
        // Aplicar filtros
        if (params.status) {
            filteredCerts = filteredCerts.filter(cert => cert.status === params.status);
        }

        return {
            success: true,
            data: {
                certifications: filteredCerts,
                total: filteredCerts.length
            }
        };
    }

    async createCertification(certificationData) {
        await this.simulateNetwork();
        
        // Buscar producto
        const product = this.products.find(p => p.id === certificationData.product_id);
        if (!product) {
            throw new Error('Producto no encontrado');
        }

        // Determinar requisitos según el tipo
        const getRequirementsForType = (type) => {
            switch(type) {
                case 'eco-basic':
                    return [
                        { name: "Análisis de materiales", status: "pending" },
                        { name: "Evaluación de proceso", status: "pending" },
                        { name: "Verificación documental", status: "pending" }
                    ];
                case 'eco-premium':
                    return [
                        { name: "Análisis de materiales", status: "pending" },
                        { name: "Evaluación de proceso", status: "pending" },
                        { name: "Verificación documental", status: "pending" },
                        { name: "Auditoría de proveedores", status: "pending" }
                    ];
                case 'carbon-neutral':
                    return [
                        { name: "Análisis de materiales", status: "pending" },
                        { name: "Cálculo de huella", status: "pending" },
                        { name: "Plan de compensación", status: "pending" }
                    ];
                default:
                    return [];
            }
        };

        const newCertification = {
            id: `cert_${this.generateId()}`,
            product: {
                id: product.id,
                name: product.name,
                category: product.category
            },
            type: certificationData.type,
            status: "pending",
            score: product.sustainability_score,
            issueDate: null,
            expiryDate: null,
            certificateId: null,
            requirements: getRequirementsForType(certificationData.type),
            appliedDate: new Date().toISOString(),
            rejectionReason: null
        };

        this.certifications.push(newCertification);
        this.saveCertifications();

        return {
            success: true,
            data: newCertification
        };
    }

    // ===== REPORTES =====
    async generateReport(reportData) {
        await this.simulateNetwork();
        
        // Simular generación de reporte
        const reportId = `report_${this.generateId()}`;
        
        return {
            success: true,
            data: {
                id: reportId,
                type: reportData.type,
                format: reportData.format,
                status: "completed",
                downloadUrl: `/api/reports/${reportId}/download`,
                generatedAt: new Date().toISOString()
            }
        };
    }
}

// Configuración para usar API real o simulada
const USE_MOCK_API = true; // Cambiar a false para usar API real

if (USE_MOCK_API) {
    window.ecoTagAPI = new EcoTagAPIMock();
    console.log('API Mock inicializada para desarrollo');
} else {
    // Para API real, usaríamos la clase EcoTagAPI original
    window.ecoTagAPI = new EcoTagAPI();
}