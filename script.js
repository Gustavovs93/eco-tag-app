// ==============================================
// script.js - ECO TAG (VERSIÓN CORREGIDA)
// ==============================================

// SIMULADOR DE BACKEND - APIs para Eco Tag
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
            password: userData.password,
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
                   exp: Math.floor(Date.now() / 1000) + (60 * 60)
               })).toString('base64') + "." +
               Math.random().toString(36).substr(2);
    },
    
    validateToken(token) {
        // Validación simple de token
        if (!token) return false;
        return token.startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.");
    }
};

// VARIABLES GLOBALES Y CONFIGURACIÓN
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let isCheckingAuth = false;

// FUNCIONES DE UTILIDAD
function loadExternalScript(url) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
            resolve();
            return;
        }
        
        const newScript = document.createElement('script');
        newScript.src = url;
        newScript.onload = resolve;
        newScript.onerror = reject;
        document.head.appendChild(newScript);
    });
}

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
    
    notification.classList.add('show');
    
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

// CONFIGURACIÓN DE PAYPAL - CORREGIDO (sin conflictos)
function getPayPalClientId() {
    // Netlify Functions
    if (window.APP_CONFIG && window.APP_CONFIG.VITE_PAYPAL_CLIENT_ID) {
        return window.APP_CONFIG.VITE_PAYPAL_CLIENT_ID;
    }
    
    // process.env (Netlify build)
    if (typeof process !== 'undefined' && process.env && process.env.VITE_PAYPAL_CLIENT_ID) {
        return process.env.VITE_PAYPAL_CLIENT_ID;
    }
    
    // Valores por defecto
    return 'SB';
}

// Inicializar PayPal (CORREGIDO - sin conflicto de variables)
function initPayPal() {
    try {
        const clientId = getPayPalClientId();
        
        console.log('💰 Inicializando PayPal con ID:', clientId);
        
        // USAR NOMBRE DIFERENTE para evitar conflicto
        const paypalLoader = document.createElement('script');
        paypalLoader.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR`;
        paypalLoader.onload = function() {
            console.log('✅ PayPal SDK cargado correctamente');
            setupPayPalButtons();
        };
        paypalLoader.onerror = function(error) {
            console.error('❌ Error cargando PayPal SDK:', error);
            showNotification('Error al cargar PayPal. Por favor, recarga la página.', 'error');
        };
        document.head.appendChild(paypalLoader);
        
    } catch (error) {
        console.error('❌ Error en initPayPal:', error);
    }
}

// Configurar botones de PayPal
function setupPayPalButtons(plan, amount) {
    if (typeof paypal === 'undefined') {
        console.error('PayPal SDK no está cargado');
        return false;
    }
    
    const container = document.getElementById('paypal-button-container');
    if (container) {
        container.innerHTML = '';
    }
    
    paypal.Buttons({
        style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
        },
        
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: amount,
                        currency_code: 'EUR'
                    },
                    description: `Suscripción ${plan} - Eco Tag`
                }]
            });
        },
        
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                handleSuccessfulPayment(details, plan, amount);
            });
        },
        
        onError: function(err) {
            console.error('Error en pago PayPal:', err);
            showNotification('Error en el procesamiento del pago. Por favor, intenta nuevamente.', 'error');
        },
        
        onCancel: function(data) {
            showNotification('Pago cancelado. Puedes intentarlo nuevamente cuando estés listo.', 'warning');
        }
    }).render('#paypal-button-container');
    
    return true;
}

// Manejar pago exitoso
function handleSuccessfulPayment(details, plan, amount) {
    console.log('Pago completado:', details);
    
    showPaymentSuccess(plan, amount, details.id);
    
    if (currentUser) {
        currentUser.plan = plan;
        showNotification(`¡Felicidades! Tu plan ${plan} ha sido activado.`, 'success');
    }
    
    localStorage.setItem('last_transaction', JSON.stringify({
        id: details.id,
        plan: plan,
        amount: amount,
        date: new Date().toISOString(),
        status: 'completed'
    }));
}

// Mostrar interfaz de éxito de pago
function showPaymentSuccess(plan, amount, transactionId) {
    const paymentContainer = document.getElementById('paypal-button-container');
    if (!paymentContainer) return;
    
    paymentContainer.innerHTML = `
        <div class="payment-success">
            <i class="fas fa-check-circle"></i>
            <h3>¡Pago Completado Exitosamente!</h3>
            <p>Gracias por suscribirte al plan <strong>${plan}</strong> de Eco Tag.</p>
            <p>Precio: <strong>${amount}€/mes</strong></p>
            <p>ID de transacción: <code>${transactionId}</code></p>
            <button class="btn btn-primary" id="continue-to-dashboard">
                Continuar al Dashboard
            </button>
        </div>
    `;
    
    document.getElementById('continue-to-dashboard').addEventListener('click', function() {
        closeModal(document.getElementById('paymentModal'));
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    });
}

// Abrir modal de pago
function openPaymentModal(plan, amount) {
    const planElement = document.getElementById('selected-plan');
    const amountElement = document.getElementById('selected-amount');
    
    if (planElement) planElement.textContent = plan;
    if (amountElement) amountElement.textContent = `${amount}€/mes`;
    
    window.selectedPlan = { plan, amount };
    
    openModal(document.getElementById('paymentModal'));
    
    if (typeof paypal !== 'undefined') {
        setupPayPalButtons(plan, amount);
    } else {
        initPayPal().then(success => {
            if (success) {
                setupPayPalButtons(plan, amount);
            } else {
                const fallback = document.getElementById('paypal-fallback');
                if (fallback) fallback.style.display = 'block';
            }
        });
    }
}

// VERIFICACIÓN DE AUTENTICACIÓN
async function checkAuthStatus() {
    if (isCheckingAuth) {
        return false;
    }
    
    isCheckingAuth = true;
    
    try {
        if (!authToken) {
            currentUser = null;
            return false;
        }
        
        if (!EcoTagAPI.validateToken(authToken)) {
            authToken = null;
            currentUser = null;
            localStorage.removeItem('authToken');
            return false;
        }
        
        try {
            const payload = authToken.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            const user = EcoTagAPI.users.find(u => u.id === decoded.userId);
            
            if (user) {
                const { password: _, ...userWithoutPassword } = user;
                currentUser = userWithoutPassword;
                updateAuthUI();
                return true;
            } else {
                throw new Error('Usuario no encontrado');
            }
        } catch (error) {
            authToken = null;
            currentUser = null;
            localStorage.removeItem('authToken');
            return false;
        }
        
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        return false;
        
    } finally {
        isCheckingAuth = false;
        updateAuthUI();
    }
}

async function requireAuthentication(requireAuth = true, redirectUrl = 'index.html') {
    const isAuthenticated = await checkAuthStatus();
    
    if (requireAuth && !isAuthenticated) {
        window.location.href = redirectUrl;
        return false;
    }
    
    if (!requireAuth && isAuthenticated) {
        window.location.href = 'dashboard.html';
        return false;
    }
    
    return isAuthenticated;
}

// ACTUALIZACIÓN DE INTERFAZ DE USUARIO
function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const startBtn = document.getElementById('startBtn');
    const demoBtn = document.getElementById('demoBtn');
    
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mobileRegisterBtn = document.getElementById('mobileRegisterBtn');
    
    const userCompanyElement = document.getElementById('userCompany');
    const userPlanElement = document.getElementById('userPlan');
    const userAvatarElement = document.getElementById('userAvatar');
    const loginRedirectElement = document.getElementById('loginRedirect');
    const dashboardContentElement = document.querySelector('.dashboard-container');
    
    if (currentUser) {
        if (loginBtn) loginBtn.textContent = 'Cerrar Sesión';
        if (registerBtn) {
            registerBtn.textContent = currentUser.company;
            registerBtn.style.background = '#27ae60';
        }
        if (startBtn) startBtn.textContent = 'Mi Dashboard';
        if (demoBtn) demoBtn.textContent = 'Ver Mis Productos';
        
        if (mobileLoginBtn) mobileLoginBtn.textContent = 'Cerrar Sesión';
        if (mobileRegisterBtn) {
            mobileRegisterBtn.textContent = currentUser.company;
            mobileRegisterBtn.style.background = '#27ae60';
        }
        
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
        if (loginBtn) loginBtn.textContent = 'Iniciar Sesión';
        if (registerBtn) {
            registerBtn.textContent = 'Registrarse';
            registerBtn.style.background = '';
        }
        if (startBtn) startBtn.textContent = 'Comenzar ahora';
        if (demoBtn) demoBtn.textContent = 'Ver demo';
        
        if (mobileLoginBtn) mobileLoginBtn.textContent = 'Iniciar Sesión';
        if (mobileRegisterBtn) {
            mobileRegisterBtn.textContent = 'Registrarse';
            mobileRegisterBtn.style.background = '';
        }
        
        if (userCompanyElement) userCompanyElement.textContent = 'Empresa';
        if (userPlanElement) userPlanElement.textContent = 'Plan';
        if (userAvatarElement) userAvatarElement.textContent = 'EU';
        if (loginRedirectElement) loginRedirectElement.style.display = 'block';
        if (dashboardContentElement) dashboardContentElement.style.display = 'none';
    }
}

// MANEJADORES DE EVENTOS DE AUTENTICACIÓN
function handleAuthClick() {
    if (currentUser) {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        updateAuthUI();
        showNotification('Sesión cerrada correctamente', 'success');
    } else {
        openModal(document.getElementById('loginModal'));
    }
}

function handleRegisterClick() {
    if (currentUser) {
        showNotification(`Bienvenido ${currentUser.company} (Plan ${currentUser.plan})`, 'success');
    } else {
        openModal(document.getElementById('registerModal'));
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!isValidEmail(email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    const loginText = document.getElementById('loginText');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginSubmit = document.getElementById('loginSubmit');
    
    if (loginText) loginText.style.display = 'none';
    if (loginSpinner) loginSpinner.style.display = 'block';
    if (loginSubmit) loginSubmit.disabled = true;
    
    try {
        const result = await EcoTagAPI.login({ email, password });
        
        authToken = result.data.token;
        currentUser = result.data.user;
        localStorage.setItem('authToken', authToken);
        
        updateAuthUI();
        
        closeModal(document.getElementById('loginModal'));
        showNotification(`Bienvenido ${currentUser.company}`, 'success');
        
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }
        
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    } finally {
        if (loginText) loginText.style.display = 'block';
        if (loginSpinner) loginSpinner.style.display = 'none';
        if (loginSubmit) loginSubmit.disabled = false;
    }
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    const company = document.getElementById('register-company').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirmPassword').value;
    const plan = document.getElementById('register-plan').value;
    
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
    
    if (password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
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
        
        authToken = result.data.token;
        currentUser = result.data.user;
        localStorage.setItem('authToken', authToken);
        
        updateAuthUI();
        
        closeModal(document.getElementById('registerModal'));
        showNotification(`¡Bienvenido a Eco Tag! Tu cuenta para ${company} ha sido creada.`, 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    } finally {
        if (registerText) registerText.style.display = 'block';
        if (registerSpinner) registerSpinner.style.display = 'none';
        if (registerSubmit) registerSubmit.disabled = false;
    }
}

// CONFIGURACIÓN DE EVENT LISTENERS
function setupAuthEventListeners() {
    const loginBtn = document.getElementById('loginBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    
    if (loginBtn) loginBtn.addEventListener('click', handleAuthClick);
    if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', handleAuthClick);
    
    const registerBtn = document.getElementById('registerBtn');
    const mobileRegisterBtn = document.getElementById('mobileRegisterBtn');
    
    if (registerBtn) registerBtn.addEventListener('click', handleRegisterClick);
    if (mobileRegisterBtn) mobileRegisterBtn.addEventListener('click', handleRegisterClick);
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
    if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);
    
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
    
    const goToLoginBtn = document.getElementById('goToLogin');
    if (goToLoginBtn) goToLoginBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

function setupEventListeners() {
    setupAuthEventListeners();
    
    const planButtons = document.querySelectorAll('.payment-btn');
    planButtons.forEach(button => {
        button.addEventListener('click', function() {
            const plan = this.dataset.plan;
            const amount = this.dataset.amount.replace('$', '').replace('/mes', '');
            openPaymentModal(plan, amount);
        });
    });
    
    const simulateSuccess = document.getElementById('simulateSuccess');
    const simulateFailure = document.getElementById('simulateFailure');
    
    if (simulateSuccess) {
        simulateSuccess.addEventListener('click', function() {
            const plan = window.selectedPlan?.plan || 'professional';
            const amount = window.selectedPlan?.amount || '79';
            handleSuccessfulPayment(
                { id: 'SIM-' + Math.random().toString(36).substr(2, 9).toUpperCase() },
                plan,
                amount
            );
        });
    }
    
    if (simulateFailure) {
        simulateFailure.addEventListener('click', function() {
            showNotification('Error en el procesamiento del pago. Por favor, intenta con otro método.', 'error');
        });
    }
    
    if (getPayPalClientId() !== 'SB') {
        initPayPal();
    }
}

// INICIALIZACIÓN DE LA APLICACIÓN
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        
        const scriptElement = document.createElement('script');
        scriptElement.src = src;
        scriptElement.onload = () => {
            console.log(`Script cargado: ${src}`);
            resolve();
        };
        scriptElement.onerror = (error) => {
            console.error(`Error cargando script: ${src}`, error);
            reject(error);
        };
        document.head.appendChild(scriptElement);
    });
}

async function initApp() {
    try {
        console.log('Inicializando aplicación Eco Tag...');
        
        await loadScript('config.js');
        
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
        
        if (window.APP_CONFIG.useMockAPI) {
            await loadScript('api-mock.js');
        } else {
            await loadScript('api.js');
        }
        
        await loadScript('cache-manager.js');
        await loadScript('notifications.js');
        
        const isAuthenticated = await checkAuthStatus();
        console.log('Usuario autenticado:', isAuthenticated);
        
        setupEventListeners();
        
        if (localStorage.getItem('darkMode') === 'true') {
            enableDarkMode();
        }
        
        await loadPageSpecificScripts();
        
        console.log('Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
        showNotification('Error al inicializar la aplicación', 'error');
    }
}

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

// INICIAR LA APLICACIÓN
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ==============================================
// FIN DE ARCHIVO CORREGIDO
// ==============================================