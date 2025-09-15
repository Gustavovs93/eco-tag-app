// ==============================================
// DEFINICIÓN GLOBAL EXPLÍCITA - PEGA ESTO AL PRINCIPIO
// ==============================================

// Limpiar funciones existentes por si hay conflicto
if (typeof window.getEnvironmentVariable !== 'undefined') {
    delete window.getEnvironmentVariable;
}

// Definir función globalmente
window.getEnvironmentVariable = function(key) {
    console.log('🔍 Buscando variable:', key);
    
    // 1. Netlify Functions
    if (window.APP_CONFIG && window.APP_CONFIG[key]) {
        console.log('✅ Encontrada en window.APP_CONFIG');
        return window.APP_CONFIG[key];
    }
    
    // 2. process.env (Netlify build)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        console.log('✅ Encontrada en process.env');
        return process.env[key];
    }
    
    // 3. Valores por defecto
    const defaults = {
        'VITE_PAYPAL_CLIENT_ID': 'SB',
        'NODE_ENV': 'development',
        'URL': window.location.origin,
        'SITE_NAME': 'Eco Tag'
    };
    
    if (defaults[key]) {
        console.log('⚠️ Usando valor por defecto para:', key);
        return defaults[key];
    }
    
    console.log('❌ Variable no encontrada:', key);
    return null;
};

// Función para debug
window.debugEnv = function() {
    console.log('🐛 Debug de variables:');
    console.log('📍 window.getEnvironmentVariable:', typeof window.getEnvironmentVariable);
    console.log('🌐 window.APP_CONFIG:', window.APP_CONFIG);
    console.log('🔧 process:', typeof process);
    
    // Probar la función
    if (typeof window.getEnvironmentVariable === 'function') {
        const paypalId = window.getEnvironmentVariable('VITE_PAYPAL_CLIENT_ID');
        console.log('💰 PayPal ID:', paypalId);
    }
};
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
/**
 * Carga un script externo
 * @param {string} url - URL del script a cargar
 * @returns {Promise} Promesa que se resuelve cuando el script se carga
 */
function loadScript(url) {
    return new Promise((resolve, reject) => {
        // Verificar si el script ya está cargado
        if (document.querySelector(`script[src="${url}"]`)) {
            resolve();
            return;
        }
        
        const verifyscript = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
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
// CONFIGURACIÓN DE PAYPAL - CORREGIDO
// ==============================================

// Obtener el Client ID de PayPal desde variables de entorno
function initPayPalSafe() {
    // SOLUCIÓN SEGURA - Sin import.meta.env
    console.log('🔍 Buscando variable PayPal...');
    
    // Método 1: Netlify Functions (si están configuradas)
    if (window.APP_CONFIG && window.APP_CONFIG.VITE_PAYPAL_CLIENT_ID) {
        return window.APP_CONFIG.VITE_PAYPAL_CLIENT_ID;
    }
    
    // Método 2: process.env (para Netlify durante el build)
    if (typeof process !== 'undefined' && process.env && process.env.VITE_PAYPAL_CLIENT_ID) {
        return process.env.VITE_PAYPAL_CLIENT_ID;
    }
    
    // Método 3: URL parameter (para testing)
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('paypal_id');
    if (urlId) return urlId;
    
    // Método 4: localStorage (para desarrollo)
    const localId = localStorage.getItem('PAYPAL_CLIENT_ID');
    if (localId) return localId;
    
    // Método 5: Fallback a sandbox
    console.log('🌐 Usando PayPal Sandbox para desarrollo');
    return 'SB'; // ID de Sandbox por defecto
}

// Función segura para inicializar PayPal
function initPayPalSafe() {
    try {
        const clientId = getPayPalClientId();
        
        console.log('💰 PayPal Client ID:', clientId.startsWith('A') ? 
            'PRODUCCIÓN (' + clientId.substring(0, 8) + '...)' : 
            'SANDBOX (' + clientId + ')');
        
        // Cargar el SDK de PayPal
        const paypal = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR`;
        script.onload = () => {
            console.log('✅ PayPal SDK cargado correctamente');
            if (typeof paypal !== 'undefined') {
                console.log('🎉 PayPal está disponible para usar');
            }
        };
        script.onerror = (error) => {
            console.error('❌ Error cargando PayPal SDK:', error);
            showNotification('Error al cargar PayPal. Por favor, recarga la página.', 'error');
        };
        document.head.appendChild(script);
        
    } catch (error) {
        console.error('❌ Error en initPayPalSafe:', error);
        // Fallback a sandbox
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://www.paypal.com/sdk/js?client-id=SB&currency=EUR';
        document.head.appendChild(fallbackScript);
    }
}

// Reemplazar la función initPayPal existente
function initPayPal() {
    return initPayPalSafe();
}

// Inicializar PayPal
async function initPayPalSafe() {
    try {
        const clientId = getPayPalClientId();
        
        // Cargar el SDK de PayPal
        await loadScript(`https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&components=buttons`);
        
        console.log('PayPal SDK cargado correctamente');
        return true;
    } catch (error) {
        console.error('Error cargando PayPal SDK:', error);
        return false;
    }
}

// Configurar botones de PayPal
function setupPayPalButtons(plan, amount) {
    if (typeof paypal === 'undefined') {
        console.error('PayPal SDK no está cargado');
        return false;
    }
    
    // Limpiar contenedor existente
    const container = document.getElementById('paypal-button-container');
    if (container) {
        container.innerHTML = '';
    }
    
    // Renderizar botones de PayPal
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
                // Pago exitoso
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
    
    // Mostrar éxito de pago
    showPaymentSuccess(plan, amount, details.id);
    
    // Actualizar el plan del usuario en el sistema
    if (currentUser) {
        currentUser.plan = plan;
        showNotification(`¡Felicidades! Tu plan ${plan} ha sido activado.`, 'success');
    }
    
    // Guardar información de la transacción
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
    
    // Event listener para el botón de continuar
    document.getElementById('continue-to-dashboard').addEventListener('click', function() {
        closeModal(document.getElementById('paymentModal'));
        
        // Redirigir al dashboard después de un pago exitoso
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    });
}

// Abrir modal de pago con el plan seleccionado
function openPaymentModal(plan, amount) {
    // Actualizar la información del modal
    const planElement = document.getElementById('selected-plan');
    const amountElement = document.getElementById('selected-amount');
    
    if (planElement) planElement.textContent = plan;
    if (amountElement) amountElement.textContent = `${amount}€/mes`;
    
    // Almacenar información del plan seleccionado
    window.selectedPlan = { plan, amount };
    
    // Abrir el modal
    openModal(document.getElementById('paymentModal'));
    
    // Inicializar PayPal si está disponible
    if (typeof paypal !== 'undefined') {
        setupPayPalButtons(plan, amount);
    } else {
        // Intentar inicializar PayPal
        initPayPal().then(success => {
            if (success) {
                setupPayPalButtons(plan, amount);
            } else {
                // Mostrar opción de simulación si PayPal no está disponible
                const fallback = document.getElementById('paypal-fallback');
                if (fallback) fallback.style.display = 'block';
            }
        });
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
     // Configurar botones de selección de plan
    const planButtons = document.querySelectorAll('.payment-btn');
    planButtons.forEach(button => {
        button.addEventListener('click', function() {
            const plan = this.dataset.plan;
            const amount = this.dataset.amount.replace('$', '').replace('/mes', '');
            openPaymentModal(plan, amount);
        });
    });
    
    // Configurar botones de simulación para desarrollo
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
    
    // Inicializar PayPal cuando la aplicación esté lista
    if (getPayPalClientId() !== 'SB') {
        // Solo inicializar PayPal si no estamos usando el sandbox ID por defecto
        initPayPal();
    }
    // Aquí puedes agregar más configuraciones de event listeners
}
// script.js - Archivo principal (actualizado)
// ==============================================
// INICIALIZACIÓN PRINCIPAL
// ==============================================

// Cargar configuración primero
const loadscript = document.createElement('script');
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
        
        const verifyscript = document.createElement('script');
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

         // Cargar variables de entorno primero
        await loadNetlifyEnv();
        
        // Configurar PayPal con las variables cargadas
        const paypalClientId = getEnvironmentVariable('VITE_PAYPAL_CLIENT_ID');
        console.log('💰 PayPal Client ID:', paypalClientId);
        
        // Inicializar PayPal
        if (paypalClientId) {
            initPayPal(paypalClientId);
        }

        // CONFIGURACIÓN DE VARIABLES DE ENTORNO PARA NETLIFY
function getEnvironmentVariable(key) {
    // SOLUCIÓN SEGURA - Sin import.meta.env
function getEnvironmentVariable(key) {
    console.log('🔍 Buscando variable:', key);
    
    // MÉTODO 1: Netlify Functions (RECOMENDADO)
    if (window.APP_CONFIG && window.APP_CONFIG[key]) {
        console.log('✅ Variable encontrada en window.APP_CONFIG');
        return window.APP_CONFIG[key];
    }
    
    // MÉTODO 2: process.env (Para Netlify durante el build)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        console.log('✅ Variable encontrada en process.env');
        return process.env[key];
    }
    
    // MÉTODO 3: URL parameters (Para testing)
    const urlParams = new URLSearchParams(window.location.search);
    const urlValue = urlParams.get(key.toLowerCase());
    if (urlValue) {
        console.log('✅ Variable encontrada en URL parameters');
        return urlValue;
    }
    
    // MÉTODO 4: localStorage (Para desarrollo)
    const localValue = localStorage.getItem(key);
    if (localValue) {
        console.log('✅ Variable encontrada en localStorage');
        return localValue;
    }
    
    // MÉTODO 5: Valores por defecto
    const defaultValue = getDefaultValue(key);
    if (defaultValue) {
        console.log('⚠️ Usando valor por defecto para:', key);
        return defaultValue;
    }
    
    console.log('❌ Variable no encontrada:', key);
    return null;
}

// Función para valores por defecto
function getDefaultValue(key) {
    const defaults = {
        'VITE_PAYPAL_CLIENT_ID': 'SB', // Sandbox mode
        'NODE_ENV': 'development',
        'URL': window.location.origin,
        'SITE_NAME': 'Eco Tag',
        'CONTACT_EMAIL': 'info@ecotag.com'
    };
    
    return defaults[key] || null;
}

// Función para cargar variables desde Netlify Function
async function loadNetlifyEnv() {
    try {
        console.log('🌐 Cargando variables desde Netlify...');
        const response = await fetch('/.netlify/functions/get-env');
        
        if (response.ok) {
            const env = await response.json();
            window.APP_CONFIG = env;
            console.log('✅ Variables cargadas:', Object.keys(env));
            return env;
        }
    } catch (error) {
        console.log('⚠️ No se pudo cargar desde Netlify Function:', error.message);
    }
    return null;
}
    
    // Fallback para desarrollo
    return window[key] || localStorage.getItem(key) || null;
}

// Configurar PayPal con variables de entorno
function configurePayPal() {
    const paypalClientId = getEnvironmentVariable('VITE_PAYPAL_CLIENT_ID');
    
    console.log('🔍 Buscando variable PayPal...');
    
    if (paypalClientId) {
        console.log('✅ VITE_PAYPAL_CLIENT_ID encontrada:', paypalClientId.substring(0, 10) + '...');
        console.log('🌐 Modo:', paypalClientId.startsWith('A') ? 'PRODUCCIÓN' : 'Sandbox');
        
        // Inicializar PayPal con el ID real
        initRealPayPal(paypalClientId);
        return true;
    } else {
        console.log('⚠️ VITE_PAYPAL_CLIENT_ID no encontrada');
        console.log('💡 Usando modo sandbox para desarrollo');
        
        // Usar sandbox como fallback
        initSandboxPayPal();
        return false;
    }
}

// Función para inicializar PayPal real
function initRealPayPal(clientId) {
    console.log('🚀 Inicializando PayPal en modo PRODUCCIÓN');
    
    // Cargar SDK de PayPal
    const paypalscript = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR`;
    script.onload = () => {
        console.log('✅ PayPal SDK cargado (PRODUCCIÓN)');
        setupPayPalButtons();
    };
    script.onerror = (error) => {
        console.error('❌ Error cargando PayPal:', error);
    };
    document.head.appendChild(script);
}

// Ejecutar configuración segura
initPayPalSafe();
       
        
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
    // ==============================================
// HACER FUNCIONES GLOBALES - Agrega esto al FINAL
// ==============================================

// Hacer funciones disponibles globalmente para debugging
window.getEnvironmentVariable = getEnvironmentVariable;
window.testEnvironmentVariables = function() {
    console.log('🧪 Probando variables de entorno...');
    
    const testVariables = ['VITE_PAYPAL_CLIENT_ID', 'NODE_ENV', 'URL'];
    
    testVariables.forEach(variable => {
        const value = getEnvironmentVariable(variable);
        console.log(`${value ? '✅' : '❌'} ${variable}:`, value || 'No encontrada');
    });
};

// Función para debuggear Netlify env
window.debugNetlifyEnv = function() {
    console.log('🔍 Debug: Verificando variables Netlify...');
    console.log('typeof process:', typeof process);
    console.log('process.env:', typeof process !== 'undefined' ? process.env : 'undefined');
    console.log('window.APP_CONFIG:', window.APP_CONFIG);
};

// Función para cargar variables manualmente
window.loadEnvManually = async function() {
    console.log('🔄 Cargando variables manualmente...');
    await loadNetlifyEnv();
    console.log('✅ Variables cargadas:', window.APP_CONFIG);
};

// Exponer otras funciones útiles para debugging
window.showAppStatus = function() {
    console.log('📊 Estado de la aplicación:');
    console.log('• Dominio:', window.location.hostname);
    console.log('• currentUser:', currentUser);
    console.log('• authToken:', authToken ? 'Presente' : 'Ausente');
    console.log('• PayPal SDK:', typeof paypal !== 'undefined' ? 'Cargado' : 'No cargado');
};
}
}