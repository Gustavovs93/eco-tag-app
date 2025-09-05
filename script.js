// ==============================================
// SIMULADOR DE BACKEND - APIs para Eco Tag
// ==============================================

const EcoTagAPI = {
    // Simular delay de red
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    // Almacenamiento simulado
    users: [
        {
            id: "user_123456",
            email: "demo@ecotag.com",
            password: "password123",
            company: "Empresa Demo",
            plan: "professional",
            createdAt: new Date()
        }
    ],
    products: [],
    scans: [],
    
    // Autenticación
    async register(userData) {
        await this.delay(1000);
        
        // Validación
        if (!userData.email || !userData.password || !userData.company) {
            throw new Error('Todos los campos son obligatorios');
        }
        
        if (userData.password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        
        if (userData.password !== userData.confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }
        
        // Verificar si el usuario ya existe
        if (this.users.find(user => user.email === userData.email)) {
            throw new Error('El usuario ya existe');
        }
        
        // Crear nuevo usuario
        const newUser = {
            id: "user_" + Math.random().toString(36).substr(2, 9),
            email: userData.email,
            password: userData.password, // En una app real, esto estaría hasheado
            company: userData.company,
            plan: userData.plan || "basic",
            createdAt: new Date()
        };
        
        this.users.push(newUser);
        
        // Devolver respuesta
        return {
            success: true,
            message: "Usuario registrado exitosamente",
            data: {
                user: {
                    id: newUser.id,
                    company: newUser.company,
                    email: newUser.email,
                    plan: newUser.plan
                },
                token: this.generateToken(newUser)
            }
        };
    },
    
    async login(credentials) {
        await this.delay(800);
        
        // Validación
        if (!credentials.email || !credentials.password) {
            throw new Error('Email y contraseña son obligatorios');
        }
        
        // Buscar usuario
        const user = this.users.find(u => u.email === credentials.email && u.password === credentials.password);
        
        if (!user) {
            throw new Error('Credenciales inválidas');
        }
        
        // Devolver respuesta
        return {
            success: true,
            message: "Login exitoso",
            data: {
                user: {
                    id: user.id,
                    company: user.company,
                    email: user.email,
                    plan: user.plan
                },
                token: this.generateToken(user)
            }
        };
    },
    
    // Productos
    async getProducts(token) {
        await this.delay(600);
        
        if (!this.validateToken(token)) {
            throw new Error('Token de autenticación inválido');
        }
        
        // Si no hay productos, devolver array vacío
        if (this.products.length === 0) {
            return {
                success: true,
                data: { products: [] }
            };
        }
        
        return {
            success: true,
            data: {
                products: this.products
            }
        };
    },
    
    async addProduct(token, productData) {
        await this.delay(800);
        
        if (!this.validateToken(token)) {
            throw new Error('Token de autenticación requerido');
        }
        
        if (!productData.name || !productData.category) {
            throw new Error('Nombre y categoría son obligatorios');
        }
        
        const newProduct = {
            id: "prod_" + Math.random().toString(36).substr(2, 9),
            name: productData.name,
            category: productData.category,
            sustainability_score: Math.floor(Math.random() * 30) + 60,
            created_at: new Date().toISOString(),
            last_scan: null
        };
        
        this.products.push(newProduct);
        
        return {
            success: true,
            message: "Producto agregado exitosamente",
            data: {
                product: newProduct
            }
        };
    },
    
    // Escaneos
    async processScan(token, scanData) {
        await this.delay(1200);
        
        if (!this.validateToken(token)) {
            throw new Error('Token de autenticación requerido');
        }
        
        // Buscar o crear producto
        let product = this.products.find(p => p.id === scanData.product_id);
        
        if (!product) {
            product = {
                id: "prod_" + Math.random().toString(36).substr(2, 9),
                name: "Producto Escaneado",
                category: "General",
                sustainability_score: 75,
                created_at: new Date().toISOString()
            };
            this.products.push(product);
        }
        
        // Registrar escaneo
        const scan = {
            scan_id: "scan_" + Math.random().toString(36).substr(2, 9),
            product: product,
            sustainability_score: 75,
            environmental_impact: {
                carbon_footprint: (Math.random() * 100 + 50).toFixed(0) + "g CO2e",
                water_usage: (Math.random() * 200 + 100).toFixed(0) + "ml",
                energy_consumption: (Math.random() * 0.5 + 0.5).toFixed(1) + "MJ"
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
        
        this.scans.push(scan);
        
        // Actualizar último escaneo del producto
        product.last_scan = new Date().toISOString();
        
        return {
            success: true,
            data: scan
        };
    },
    
    // Helper methods
    generateToken(user) {
        // Simular un token JWT
        return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + 
               Buffer.from(JSON.stringify({
                   userId: user.id,
                   email: user.email,
                   exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
               })).toString('base64') + "." +
               Math.random().toString(36).substr(2);
    },
    
    validateToken(token) {
        // Validación simple de token
        if (!token) return false;
        return token.startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.");
    }
};

// ==============================================
// VARIABLES GLOBALES Y CONFIGURACIÓN
// ==============================================

// Variables globales
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let isCheckingAuth = false;

// ==============================================
// FUNCIONES DE UTILIDAD
// ==============================================

// Sistema de notificaciones
function showNotification(message, type = 'success', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    if (type === 'info') icon = 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger reflow
    void notification.offsetWidth;
    
    // Mostrar notificación
    notification.classList.add('show');
    
    // Ocultar después de la duración especificada
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// Validar email
function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Funciones para modales
function openModal(modal) {
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// ==============================================
// VERIFICACIÓN DE AUTENTICACIÓN
// ==============================================

/**
 * Verifica el estado de autenticación del usuario
 * @returns {Promise<boolean>} True si está autenticado, false si no
 */
async function checkAuthStatus() {
    // Evitar múltiples verificaciones simultáneas
    if (isCheckingAuth) {
        return false;
    }
    
    isCheckingAuth = true;
    
    try {
        // Si no hay token, no está autenticado
        if (!authToken) {
            currentUser = null;
            return false;
        }
        
        // Para el simulador, verificar si el token es válido
        if (!EcoTagAPI.validateToken(authToken)) {
            // Token inválido o expirado
            authToken = null;
            currentUser = null;
            localStorage.removeItem('authToken');
            return false;
        }
        
        // Buscar usuario basado en el token (para el simulador)
        try {
            // Decodificar el token simulado
            const payload = authToken.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            const user = EcoTagAPI.users.find(u => u.id === decoded.userId);
            
            if (user) {
                // Eliminar password de la respuesta
                const { password: _, ...userWithoutPassword } = user;
                currentUser = userWithoutPassword;
                updateAuthUI();
                return true;
            } else {
                throw new Error('Usuario no encontrado');
            }
        } catch (error) {
            // Token inválido o expirado
            authToken = null;
            currentUser = null;
            localStorage.removeItem('authToken');
            return false;
        }
        
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        
        // Token inválido o expirado
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        return false;
        
    } finally {
        isCheckingAuth = false;
        updateAuthUI();
    }
}

/**
 * Verifica autenticación y redirige si es necesario
 * @param {boolean} requireAuth - Si se requiere autenticación
 * @param {string} redirectUrl - URL a la que redirigir si no autenticado
 */
async function requireAuthentication(requireAuth = true, redirectUrl = 'index.html') {
    const isAuthenticated = await checkAuthStatus();
    
    if (requireAuth && !isAuthenticated) {
        // Redirigir a la página de login
        window.location.href = redirectUrl;
        return false;
    }
    
    if (!requireAuth && isAuthenticated) {
        // Si ya está autenticado pero la página no lo requiere (como login)
        // Podemos redirigir al dashboard
        window.location.href = 'dashboard.html';
        return false;
    }
    
    return isAuthenticated;
}

// ==============================================
// ACTUALIZACIÓN DE INTERFAZ DE USUARIO
// ==============================================

/**
 * Actualiza la UI basada en el estado de autenticación
 */
function updateAuthUI() {
    // Elementos en la página principal (index.html)
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const startBtn = document.getElementById('startBtn');
    const demoBtn = document.getElementById('demoBtn');
    
    // Elementos en el menú móvil
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mobileRegisterBtn = document.getElementById('mobileRegisterBtn');
    
    // Elementos en páginas internas (dashboard, products, etc.)
    const userCompanyElement = document.getElementById('userCompany');
    const userPlanElement = document.getElementById('userPlan');
    const userAvatarElement = document.getElementById('userAvatar');
    const loginRedirectElement = document.getElementById('loginRedirect');
    const dashboardContentElement = document.querySelector('.dashboard-container');
    
    if (currentUser) {
        // USUARIO AUTENTICADO
        
        // Página principal
        if (loginBtn) loginBtn.textContent = 'Cerrar Sesión';
        if (registerBtn) {
            registerBtn.textContent = currentUser.company;
            registerBtn.style.background = '#27ae60';
        }
        if (startBtn) startBtn.textContent = 'Mi Dashboard';
        if (demoBtn) demoBtn.textContent = 'Ver Mis Productos';
        
        // Menú móvil
        if (mobileLoginBtn) mobileLoginBtn.textContent = 'Cerrar Sesión';
        if (mobileRegisterBtn) {
            mobileRegisterBtn.textContent = currentUser.company;
            mobileRegisterBtn.style.background = '#27ae60';
        }
        
        // Páginas internas
        if (userCompanyElement) userCompanyElement.textContent = currentUser.company;
        if (userPlanElement) {
            userPlanElement.textContent = `Plan ${currentUser.plan.charAt(0).toUpperCase() + currentUser.plan.slice(1)}`;
        }
        if (userAvatarElement && currentUser.company) {
            userAvatarElement.textContent = currentUser.company.charAt(0).toUpperCase();
        }
        if (loginRedirectElement) loginRedirectElement.style.display = 'none';
        if (dashboardContentElement) dashboardContentElement.style.display = 'flex';
        
    } else {
        // USUARIO NO AUTENTICADO
        
        // Página principal
        if (loginBtn) loginBtn.textContent = 'Iniciar Sesión';
        if (registerBtn) {
            registerBtn.textContent = 'Registrarse';
            registerBtn.style.background = '';
        }
        if (startBtn) startBtn.textContent = 'Comenzar ahora';
        if (demoBtn) demoBtn.textContent = 'Ver demo';
        
        // Menú móvil
        if (mobileLoginBtn) mobileLoginBtn.textContent = 'Iniciar Sesión';
        if (mobileRegisterBtn) {
            mobileRegisterBtn.textContent = 'Registrarse';
            mobileRegisterBtn.style.background = '';
        }
        
        // Páginas internas
        if (userCompanyElement) userCompanyElement.textContent = 'Empresa';
        if (userPlanElement) userPlanElement.textContent = 'Plan';
        if (userAvatarElement) userAvatarElement.textContent = 'EU';
        if (loginRedirectElement) loginRedirectElement.style.display = 'block';
        if (dashboardContentElement) dashboardContentElement.style.display = 'none';
    }
}

// ==============================================
// MANEJADORES DE EVENTOS DE AUTENTICACIÓN
// ==============================================

/**
 * Maneja el clic en botones de autenticación
 */
function handleAuthClick() {
    if (currentUser) {
        // Cerrar sesión
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        updateAuthUI();
        showNotification('Sesión cerrada correctamente', 'success');
    } else {
        // Abrir modal de login
        openModal(document.getElementById('loginModal'));
    }
}

/**
 * Maneja el clic en botones de registro
 */
function handleRegisterClick() {
    if (currentUser) {
        showNotification(`Bienvenido ${currentUser.company} (Plan ${currentUser.plan})`, 'success');
    } else {
        openModal(document.getElementById('registerModal'));
    }
}

/**
 * Maneja el envío del formulario de login
 * @param {Event} e - Evento del formulario
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Validación básica
    if (!isValidEmail(email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Mostrar loading
    const loginText = document.getElementById('loginText');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginSubmit = document.getElementById('loginSubmit');
    
    if (loginText) loginText.style.display = 'none';
    if (loginSpinner) loginSpinner.style.display = 'block';
    if (loginSubmit) loginSubmit.disabled = true;
    
    try {
        const result = await EcoTagAPI.login({ email, password });
        
        // Guardar token y usuario
        authToken = result.data.token;
        currentUser = result.data.user;
        localStorage.setItem('authToken', authToken);
        
        // Actualizar UI
        updateAuthUI();
        
        // Cerrar modal y mostrar mensaje
        closeModal(document.getElementById('loginModal'));
        showNotification(`Bienvenido ${currentUser.company}`, 'success');
        
        // Redirigir si estamos en la página principal
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }
        
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    } finally {
        // Ocultar loading
        if (loginText) loginText.style.display = 'block';
        if (loginSpinner) loginSpinner.style.display = 'none';
        if (loginSubmit) loginSubmit.disabled = false;
    }
}

/**
 * Maneja el envío del formulario de registro
 * @param {Event} e - Evento del formulario
 */
async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    const company = document.getElementById('register-company').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirmPassword').value;
    const plan = document.getElementById('register-plan').value;
    
    // Validaciones
    if (company.length < 2) {
        showNotification('El nombre de la empresa debe tener al menos 2 caracteres', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Validar contraseñas
    if (password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    // Mostrar loading
    const registerText = document.getElementById('registerText');
    const registerSpinner = document.getElementById('registerSpinner');
    const registerSubmit = document.getElementById('registerSubmit');
    
    if (registerText) registerText.style.display = 'none';
    if (registerSpinner) registerSpinner.style.display = 'block';
    if (registerSubmit) registerSubmit.disabled = true;
    
    try {
        const result = await EcoTagAPI.register({
            company, email, password, confirmPassword, plan
        });
        
        // Guardar token y usuario
        authToken = result.data.token;
        currentUser = result.data.user;
        localStorage.setItem('authToken', authToken);
        
        // Actualizar UI
        updateAuthUI();
        
        // Cerrar modal y mostrar mensaje
        closeModal(document.getElementById('registerModal'));
        showNotification(`¡Bienvenido a Eco Tag! Tu cuenta para ${company} ha sido creada.`, 'success');
        
        // Redirigir al dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    } finally {
        // Ocultar loading
        if (registerText) registerText.style.display = 'block';
        if (registerSpinner) registerSpinner.style.display = 'none';
        if (registerSubmit) registerSubmit.disabled = false;
    }
}

// ==============================================
// CONFIGURACIÓN DE EVENT LISTENERS
// ==============================================

/**
 * Configura los event listeners de autenticación
 */
function setupAuthEventListeners() {
    // Botones de login
    const loginBtn = document.getElementById('loginBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    
    if (loginBtn) loginBtn.addEventListener('click', handleAuthClick);
    if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', handleAuthClick);
    
    // Botones de registro
    const registerBtn = document.getElementById('registerBtn');
    const mobileRegisterBtn = document.getElementById('mobileRegisterBtn');
    
    if (registerBtn) registerBtn.addEventListener('click', handleRegisterClick);
    if (mobileRegisterBtn) mobileRegisterBtn.addEventListener('click', handleRegisterClick);
    
    // Formularios de login y registro
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
    if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);
    
    // Enlaces entre formularios
    const goToLogin = document.getElementById('goToLogin');
    const goToRegister = document.getElementById('goToRegister');
    
    if (goToLogin) goToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(document.getElementById('registerModal'));
        openModal(document.getElementById('loginModal'));
    });
    
    if (goToRegister) goToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(document.getElementById('loginModal'));
        openModal(document.getElementById('registerModal'));
    });
    
    // Redirección de login
    const goToLoginBtn = document.getElementById('goToLogin');
    if (goToLoginBtn) goToLoginBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

/**
 * Configura los event listeners de la aplicación
 */
function setupEventListeners() {
    setupAuthEventListeners();
    // Aquí puedes agregar más configuraciones de event listeners
}
// script.js - Archivo principal (actualizado)
// ==============================================
// INICIALIZACIÓN PRINCIPAL
// ==============================================

// Cargar configuración primero
const script = document.createElement('script');
script.src = 'config.js';
document.head.appendChild(script);

// Esperar a que la configuración se cargue
script.onload = async function() {
    // Cargar los demás scripts
    await loadScript('cache-manager.js');
    await loadScript('api.js');
    await loadScript('notifications.js');
// ==============================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==============================================

/**
 * Inicializa la aplicación
 */
// Función para cargar scripts de manera ordenada
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Verificar si el script ya está cargado
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            console.log(`Script cargado: ${src}`);
            resolve();
        };
        script.onerror = (error) => {
            console.error(`Error cargando script: ${src}`, error);
            reject(error);
        };
        document.head.appendChild(script);
    });
}

// Función para inicializar la aplicación
async function initApp() {
    try {
        console.log('Inicializando aplicación Eco Tag...');
        
        // Cargar scripts básicos primero
        await loadScript('config.js');
        
        // Esperar a que la configuración esté disponible
        await new Promise(resolve => {
            const checkConfig = () => {
                if (window.APP_CONFIG) {
                    resolve();
                } else {
                    setTimeout(checkConfig, 100);
                }
            };
            checkConfig();
        });
        
        console.log('Configuración cargada:', window.APP_CONFIG);
        
        // Cargar los demás scripts según la configuración
        if (window.APP_CONFIG.useMockAPI) {
            await loadScript('api-mock.js');
        } else {
            await loadScript('api.js');
        }
        
        await loadScript('cache-manager.js');
        await loadScript('notifications.js');
        
        // Verificar autenticación
        const isAuthenticated = await checkAuthStatus();
        console.log('Usuario autenticado:', isAuthenticated);
        
        // Configurar event listeners
        setupEventListeners();
        
        // Inicializar modo oscuro si está activado
        if (localStorage.getItem('darkMode') === 'true') {
            enableDarkMode();
        }
        
        // Cargar scripts específicos de página
        await loadPageSpecificScripts();
        
        console.log('Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
        showNotification('Error al inicializar la aplicación', 'error');
    }
}

// Función para cargar scripts específicos de página
async function loadPageSpecificScripts() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    const pageScripts = {
        'dashboard.html': 'dashboard.js',
        'products.html': 'products.js',
        'scans.html': 'scans.js',
        'certifications.html': 'certifications.js',
        'reports.html': 'reports.js',
        'settings.html': 'settings.js'
    };
    
    if (pageScripts[page]) {
        try {
            await loadScript(pageScripts[page]);
            console.log(`Script específico cargado: ${pageScripts[page]}`);
        } catch (error) {
            console.warn(`No se pudo cargar el script específico: ${pageScripts[page]}`, error);
        }
    }
}

// Iniciar la aplicación cuando esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // El DOM ya está listo, iniciar inmediatamente
    initApp();
}

// ==============================================
// FUNCIONES PRINCIPALES DE LA APLICACIÓN
// ==============================================

// Inicializar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
}