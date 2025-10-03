// ===============================
// 🎯 VARIABLES GLOBALES
// ===============================
let currentUser = null;
let allScans = [];
let currentPage = 1;
let rowsPerPage = 10;
let filteredScans = [];

// ===============================
// 🛠️ FUNCIONES DE UTILIDAD
// ===============================
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
        ${message}
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = 'auto';
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    const section = document.getElementById(sectionId);
    if (section) section.style.display = 'block';
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    
    const titles = {
        'dashboard': 'Dashboard',
        'scanner': 'Escáner de Productos',
        'products': 'Gestión de Productos',
        'reports': 'Reportes y Análisis',
        'settings': 'Configuración'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId] || 'Dashboard';
}

// ===============================
// 🔐 FUNCIÓN handleLogout MEJORADA usando api.js
// ===============================
async function handleLogout() {
    if (!confirm('¿Estás seguro de que quieres cerrar sesión?')) return;
    
    try {
        console.log('🚪 Iniciando logout...');
        
        // ✅ ESTRATEGIA 1: Usar api.js de EcoTag
        if (window.ecoTagAPI && typeof window.ecoTagAPI.logout === 'function') {
            console.log('🔄 Usando logout de EcoTagAPI');
            await window.ecoTagAPI.logout();
            console.log('✅ Logout exitoso via EcoTagAPI');
        }
        // ✅ ESTRATEGIA 2: Usar Firebase Auth
        else if (window.firebaseAuth?.signOut && window.firebaseApp?.auth) {
            console.log('🔄 Usando logout de Firebase');
            await window.firebaseAuth.signOut(window.firebaseApp.auth);
            console.log('✅ Logout exitoso via Firebase');
        }
        // ✅ ESTRATEGIA 3: Fallback - limpiar todo
        else {
            console.log('🔄 Usando fallback general');
            if (window.ecoTagAPI) {
                window.ecoTagAPI.removeAuthToken();
            }
            localStorage.removeItem('authToken');
            localStorage.removeItem('firebase:authUser:');
            sessionStorage.clear();
            console.log('✅ Todos los datos limpiados');
        }
        
        showNotification('Sesión cerrada correctamente 👋', 'success');
        
        // Redirigir al login
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error en logout:', error);
        
        // Limpiar de todas formas y redirigir
        if (window.ecoTagAPI) {
            window.ecoTagAPI.removeAuthToken();
        }
        localStorage.removeItem('authToken');
        
        showNotification('Sesión cerrada', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// ===============================
// 📊 FUNCIONES DEL DASHBOARD INTEGRADAS CON API
// ===============================
async function loadUserData() {
    try {
        showLoadingState(true);
        
        // ✅ PRIMERO: Intentar con EcoTagAPI
        if (window.ecoTagAPI && typeof window.ecoTagAPI.getCurrentUser === 'function') {
            console.log('🔄 Cargando usuario via EcoTagAPI');
            const userData = await window.ecoTagAPI.getCurrentUser();
            updateUserUI(userData);
        }
        // ✅ SEGUNDO: Fallback a Firebase
        else if (window.firebaseApp?.auth?.currentUser) {
            console.log('🔄 Cargando usuario via Firebase');
            const user = window.firebaseApp.auth.currentUser;
            const companyDoc = await window.firebaseFirestore.getDoc(
                window.firebaseFirestore.doc(window.firebaseApp.db, "companies", user.uid)
            );
            if (companyDoc.exists()) {
                updateUserUI(companyDoc.data());
            }
        } else {
            throw new Error('No hay usuario autenticado');
        }

        // Cargar escaneos
        await loadScans();

    } catch (error) {
        console.error('Error cargando datos:', error);
        showNotification('Error cargando datos del usuario', 'error');
        redirectToLogin();
    } finally {
        showLoadingState(false);
    }
}

function updateUserUI(userData) {
    document.getElementById('userName').textContent = userData.name || userData.companyName || 'Usuario';
    document.getElementById('userRole').textContent = `Plan: ${userData.plan || 'Básico'}`;
    document.getElementById('userAvatar').innerHTML = (userData.name?.charAt(0) || userData.companyName?.charAt(0) || 'U').toUpperCase();
}

async function loadScans() {
    try {
        showLoadingState(true);
        
        // ✅ USAR EcoTagAPI para cargar escaneos
        if (window.ecoTagAPI && typeof window.ecoTagAPI.getScans === 'function') {
            console.log('🔄 Cargando escaneos via EcoTagAPI');
            const response = await window.ecoTagAPI.getScans({
                page: currentPage,
                limit: rowsPerPage,
                sort: '-date'
            });
            
            allScans = response.scans || response.data || response;
        } else {
            // Fallback: datos mock
            console.log('🔄 Cargando escaneos mock');
            allScans = await getMockScans();
        }
        
        filteredScans = Array.isArray(allScans) ? [...allScans] : [];
        renderScansTable();
        
    } catch (error) {
        console.error('Error cargando escaneos:', error);
        showNotification('Error cargando escaneos', 'error');
        // Mostrar datos vacíos
        allScans = [];
        filteredScans = [];
        renderScansTable();
    } finally {
        showLoadingState(false);
    }
}

// Función de fallback para datos mock
async function getMockScans() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
        {
            id: '1',
            productName: 'Botella de Agua Mineral',
            brand: 'AguaPure',
            score: 65,
            date: new Date().toISOString(),
            category: 'Bebidas',
            sustainabilityScore: 65
        },
        {
            id: '2',
            productName: 'Galletas Integrales',
            brand: 'NatureFood',
            score: 78,
            date: new Date(Date.now() - 86400000).toISOString(),
            category: 'Alimentos',
            sustainabilityScore: 78
        },
        {
            id: '3', 
            productName: 'Detergente Líquido',
            brand: 'EcoClean',
            score: 45,
            date: new Date(Date.now() - 172800000).toISOString(),
            category: 'Limpieza',
            sustainabilityScore: 45
        }
    ];
}

function renderScansTable() {
    const tbody = document.getElementById('scansTableBody');
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageScans = filteredScans.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    if (pageScans.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">
                    <i class="fas fa-inbox"></i>
                    <p>No hay escaneos para mostrar</p>
                    <button class="btn btn-green" onclick="openModal('scanModal')" style="margin-top: 10px;">
                        <i class="fas fa-camera"></i>
                        Realizar primer escaneo
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    pageScans.forEach(scan => {
        const row = document.createElement('tr');
        const scoreClass = getScoreBadgeClass(scan.score || scan.sustainabilityScore);
        
        row.innerHTML = `
            <td>
                <div class="product-cell">
                    <div class="product-image">
                        <i class="fas fa-${getProductIcon(scan.category)}"></i>
                    </div>
                    <div>
                        <strong>${scan.productName}</strong>
                        <div style="font-size: 0.8rem; color: #777;">${scan.category || 'General'}</div>
                    </div>
                </div>
            </td>
            <td>${scan.brand || 'N/A'}</td>
            <td>
                <span class="score-badge ${scoreClass}">
                    ${scan.score || scan.sustainabilityScore}%
                </span>
            </td>
            <td>${formatDate(scan.date || scan.scannedAt)}</td>
            <td>
                <div class="action-cell">
                    <div class="btn-icon" onclick="viewScanDetail('${scan.id}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </div>
                    <div class="btn-icon" onclick="editScan('${scan.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </div>
                    <div class="btn-icon" onclick="deleteScan('${scan.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    updatePagination();
}

function getProductIcon(category) {
    const icons = {
        'Bebidas': 'wine-bottle',
        'Alimentos': 'apple-alt',
        'Limpieza': 'spray-can',
        'Higiene': 'soap',
        'Electrónicos': 'mobile-alt',
        'Ropa': 'tshirt'
    };
    return icons[category] || 'cube';
}

function getScoreBadgeClass(score) {
    if (score >= 70) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updatePagination() {
    const totalPages = Math.ceil(filteredScans.length / rowsPerPage);
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || totalPages === 0;
    document.getElementById('pageInfo').textContent = `Página ${currentPage} de ${totalPages || 1}`;
    document.getElementById('tableInfo').textContent = 
        `Mostrando ${Math.min(filteredScans.length, rowsPerPage)} de ${filteredScans.length} registros`;
}

function showLoadingState(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// ===============================
// 🎯 INICIALIZACIÓN MEJORADA
// ===============================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Dashboard...');
    
    const initDashboard = async () => {
        try {
            // Esperar a que los recursos críticos estén listos
            await waitForCriticalResources();
            
            // Ocultar loading inicial
            showLoadingState(false);
            
            // Configurar event listeners
            setupEventListeners();
            
            // Verificar autenticación y cargar datos
            await checkAuthenticationAndLoadData();
            
            console.log('✅ Dashboard inicializado con EcoTagAPI');
            
        } catch (error) {
            console.error('Error inicializando dashboard:', error);
            showNotification('Error inicializando la aplicación', 'error');
            redirectToLogin();
        }
    };

    initDashboard();
});

function waitForCriticalResources() {
    return new Promise((resolve) => {
        const checkResources = () => {
            // Verificar si Firebase o EcoTagAPI están disponibles
            const isFirebaseReady = window.firebaseApp && window.firebaseApp.auth;
            const isAPIReady = window.ecoTagAPI;
            
            if (isFirebaseReady || isAPIReady) {
                resolve();
            } else {
                console.log('⏳ Esperando recursos críticos...');
                setTimeout(checkResources, 100);
            }
        };
        checkResources();
    });
}

async function checkAuthenticationAndLoadData() {
    // Verificar autenticación con EcoTagAPI
    if (window.ecoTagAPI && window.ecoTagAPI.authToken) {
        console.log('🔐 Usuario autenticado via EcoTagAPI');
        await loadUserData();
        return;
    }
    
    // Verificar autenticación con Firebase
    if (window.firebaseApp?.auth?.currentUser) {
        console.log('🔐 Usuario autenticado via Firebase');
        
        // Si tenemos Firebase pero no token de API, intentar sincronizar
        if (window.ecoTagAPI && !window.ecoTagAPI.authToken) {
            await syncFirebaseWithAPI();
        } else {
            await loadUserData();
        }
        return;
    }
    
    // No autenticado en ningún sistema
    console.log('❌ No hay usuario autenticado');
    redirectToLogin();
}

async function syncFirebaseWithAPI() {
    try {
        console.log('🔄 Sincronizando Firebase con API...');
        const user = window.firebaseApp.auth.currentUser;
        const token = await user.getIdToken();
        
        // Establecer token en la API
        window.ecoTagAPI.setAuthToken(token);
        
        // Cargar datos
        await loadUserData();
        
    } catch (error) {
        console.error('Error sincronizando con API:', error);
        // Continuar con Firebase como fallback
        await loadUserData();
    }
}

function setupEventListeners() {
    // ✅ CONECTAR EVENT LISTENERS
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Navegación del sidebar
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Filtros y búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', applyFilters);
    }
    
    const scoreFilter = document.getElementById('scoreFilter');
    if (scoreFilter) {
        scoreFilter.addEventListener('change', applyFilters);
    }
    
    const rowsPerPageSelect = document.getElementById('rowsPerPage');
    if (rowsPerPageSelect) {
        rowsPerPageSelect.addEventListener('change', function() {
            rowsPerPage = parseInt(this.value);
            currentPage = 1;
            renderScansTable();
        });
    }

    // Paginación
    const prevPage = document.getElementById('prevPage');
    if (prevPage) {
        prevPage.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                renderScansTable();
            }
        });
    }

    const nextPage = document.getElementById('nextPage');
    if (nextPage) {
        nextPage.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredScans.length / rowsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderScansTable();
            }
        });
    }

    // Cerrar modales con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

function redirectToLogin() {
    showNotification('Redirigiendo al login...', 'warning');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

// ===============================
// 📋 FUNCIONES ADICIONALES
// ===============================
function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('dateFilter')?.value || 'all';
    const scoreFilter = document.getElementById('scoreFilter')?.value || 'all';

    filteredScans = allScans.filter(scan => {
        // Filtro de búsqueda
        const matchesSearch = 
            scan.productName?.toLowerCase().includes(searchTerm) ||
            scan.brand?.toLowerCase().includes(searchTerm) ||
            scan.category?.toLowerCase().includes(searchTerm);

        // Filtro de fecha
        const matchesDate = filterByDate(scan.date || scan.scannedAt, dateFilter);

        // Filtro de puntuación
        const score = scan.score || scan.sustainabilityScore;
        const matchesScore = filterByScore(score, scoreFilter);

        return matchesSearch && matchesDate && matchesScore;
    });

    currentPage = 1;
    renderScansTable();
}

function filterByDate(dateString, filterType) {
    if (filterType === 'all') return true;
    
    const date = new Date(dateString);
    const now = new Date();
    
    switch (filterType) {
        case 'today':
            return date.toDateString() === now.toDateString();
        case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return date >= weekAgo;
        case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return date >= monthAgo;
        default:
            return true;
    }
}

function filterByScore(score, filterType) {
    if (filterType === 'all') return true;
    
    switch (filterType) {
        case 'high':
            return score >= 70;
        case 'medium':
            return score >= 50 && score < 70;
        case 'low':
            return score < 50;
        default:
            return true;
    }
}

// Funciones placeholder para acciones
function viewScanDetail(scanId) {
    showNotification(`Viendo detalles del escaneo ${scanId}`, 'info');
    // Aquí iría la navegación a la página de detalles
}

function editScan(scanId) {
    showNotification(`Editando escaneo ${scanId}`, 'info');
    // Aquí iría la lógica de edición
}

async function deleteScan(scanId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este escaneo?')) return;
    
    try {
        showNotification('Eliminando escaneo...', 'info');
        
        // ✅ USAR EcoTagAPI para eliminar
        if (window.ecoTagAPI && typeof window.ecoTagAPI.request === 'function') {
            await window.ecoTagAPI.request(`/scans/${scanId}`, {
                method: 'DELETE'
            });
        }
        
        // Actualizar la lista
        allScans = allScans.filter(scan => scan.id !== scanId);
        filteredScans = filteredScans.filter(scan => scan.id !== scanId);
        renderScansTable();
        
        showNotification('Escaneo eliminado correctamente', 'success');
    } catch (error) {
        console.error('Error eliminando escaneo:', error);
        showNotification('Error eliminando escaneo', 'error');
    }
}

function generateReport() {
    showNotification('Generando reporte...', 'info');
    // Aquí iría la lógica real de generación de reportes usando EcoTagAPI
}