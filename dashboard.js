// dashboard.js - Funcionalidades específicas del dashboard
class Dashboard {
    constructor() {
        this.stats = {
            products: 0,
            scans: 0,
            certifications: 0,
            averageScore: 0
        };
    }
    
    async init() {
        await this.loadData();
        this.renderCharts();
        this.setupEventListeners();
        
        // Iniciar tour de onboarding para nuevos usuarios
        if (this.isFirstVisit()) {
            setTimeout(() => {
                this.startOnboardingTour();
            }, 2000);
        }
    }
    
    async loadData() {
        try {
            // Cargar datos en paralelo
            const [productsData, scansData, certsData] = await Promise.all([
                window.ecoTagAPI.getProducts(),
                window.ecoTagAPI.getScans(),
                window.ecoTagAPI.getCertifications()
            ]);
            
            // Procesar estadísticas
            this.stats.products = productsData.data.products.length;
            this.stats.scans = scansData.data.scans.length;
            this.stats.certifications = certsData.data.certifications.length;
            
            // Calcular puntuación promedio
            if (scansData.data.scans.length > 0) {
                const totalScore = scansData.data.scans.reduce((sum, scan) => sum + scan.sustainability_score, 0);
                this.stats.averageScore = Math.round(totalScore / scansData.data.scans.length);
            }
            
            this.updateStatsDisplay();
            this.renderRecentActivity(scansData.data.scans.slice(0, 5));
            this.renderProducts(productsData.data.products.slice(0, 3));
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showNotification('Error al cargar los datos del dashboard', 'error');
        }
    }
    
    updateStatsDisplay() {
        document.getElementById('totalProducts').textContent = this.stats.products;
        document.getElementById('totalScans').textContent = this.stats.scans;
        document.getElementById('totalCerts').textContent = this.stats.certifications;
        document.getElementById('averageScore').textContent = `${this.stats.averageScore}%`;
    }
    
    renderCharts() {
        // Implementar gráficos con Chart.js o similar
        this.renderSustainabilityTrendChart();
        this.renderCategoryDistributionChart();
    }
    
    renderSustainabilityTrendChart() {
        // placeholder para gráfico de tendencias
        console.log('Renderizando gráfico de tendencias...');
    }
    
    renderCategoryDistributionChart() {
        // placeholder para gráfico de distribución
        console.log('Renderizando gráfico de distribución...');
    }
    
    renderRecentActivity(scans) {
        const container = document.getElementById('recentScansContainer');
        if (!container) return;
        
        if (scans.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No hay escaneos recientes</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = scans.map(scan => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-qrcode"></i>
                </div>
                <div class="activity-content">
                    <h4>${scan.product.name}</h4>
                    <p>Escaneado el ${new Date(scan.scanned_at).toLocaleDateString()}</p>
                    <span class="score-badge score-${this.getScoreClass(scan.sustainability_score)}">
                        ${scan.sustainability_score}%
                    </span>
                </div>
            </div>
        `).join('');
    }
    
    getScoreClass(score) {
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return 'low';
    }
    
    renderProducts(products) {
        const container = document.getElementById('recentProductsContainer');
        if (!container) return;
        
        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-cube"></i>
                    <p>No hay productos</p>
                    <a href="products.html" class="btn btn-green">Agregar Productos</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <i class="fas fa-${this.getProductIcon(product.category)}"></i>
                </div>
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p>${product.category}</p>
                    <span class="score-badge score-${this.getScoreClass(product.sustainability_score)}">
                        ${product.sustainability_score}%
                    </span>
                </div>
            </div>
        `).join('');
    }
    
    getProductIcon(category) {
        const icons = {
            'Envases': 'wine-bottle',
            'Textil': 'tshirt',
            'Electrónica': 'mobile-alt',
            'Alimentación': 'apple-alt',
            'Hogar': 'couch'
        };
        return icons[category] || 'cube';
    }
    
    isFirstVisit() {
        const visited = localStorage.getItem('dashboardVisited');
        if (!visited) {
            localStorage.setItem('dashboardVisited', 'true');
            return true;
        }
        return false;
    }
    
    startOnboardingTour() {
        if (window.userOnboarding) {
            window.userOnboarding.startTour('dashboard');
        }
    }
    
    setupEventListeners() {
        // Event listeners para el dashboard
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadData();
                showNotification('Datos actualizados', 'success');
            });
        }
    }
}

// Inicializar dashboard cuando la página esté cargada
if (window.location.pathname.includes('dashboard.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboard = new Dashboard();
        window.dashboard.init();
    });
}