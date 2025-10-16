// app.js - Aplicación principal optimizada para producción
class EcoTagApp {
    constructor() {
        this.currentUser = null;
        this.stream = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Inicialización diferida
            await this.initializeDependencies();
            this.setupEventListeners();
            this.checkAuthState();
            this.isInitialized = true;
            
            console.log('🚀 Eco Tag App inicializada en producción');
        } catch (error) {
            console.error('Error inicializando app:', error);
            this.showNotification('Error inicializando la aplicación', 'error');
        }
    }

    async initializeDependencies() {
        // Cargar Firebase solo cuando sea necesario
        if (typeof initializeFirebase === 'function') {
            await initializeFirebase();
        }
        
        // Inicializar API
        if (window.ecoTagAPI) {
            window.ecoTagAPI.baseURL = window.APP_CONFIG?.apiUrl || 'https://api.ecotag.com';
        }
    }

        setupEventListeners() {
        // Autenticación
        document.getElementById('loginBtn')?.addEventListener('click', () => this.openModal('loginModal'));
        document.getElementById('registerBtn')?.addEventListener('click', () => this.openModal('registerModal'));
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
        
        // Forms
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm')?.addEventListener('submit', (e) => this.handleRegister(e));
        
        // Scanner
        document.getElementById('start-camera')?.addEventListener('click', () => this.startCamera());
        document.getElementById('capture-btn')?.addEventListener('click', () => this.captureImage());
        document.getElementById('switch-camera')?.addEventListener('click', () => this.switchCamera());
        
        // Navegación
        document.getElementById('startBtn')?.addEventListener('click', () => this.handleStart());
        document.getElementById('demoBtn')?.addEventListener('click', () => this.showDemo());
        
        // ✅ NUEVO: Recuperación de contraseña
        document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openForgotPasswordModal();
        });
        
        document.getElementById('backToLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeModal('forgotPasswordModal');
            this.openModal('loginModal');
        });
        
        document.getElementById('forgotPasswordForm')?.addEventListener('submit', (e) => {
            this.handlePasswordReset(e);
        });
        
        // Cerrar modales
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) this.closeModal(modal.id);
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal.id);
            });
        });

        // Teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    this.closeModal(modal.id);
                });
            }
        });
    }

        // ✅ NUEVO: Abrir modal de recuperación de contraseña
    openForgotPasswordModal() {
        this.closeModal('loginModal');
        this.openModal('forgotPasswordModal');
        // Limpiar y enfocar el campo email
        document.getElementById('resetEmail').value = '';
        document.getElementById('resetEmail').focus();
    }

    // ✅ NUEVO: Manejar envío de recuperación
    async handlePasswordReset(e) {
        e.preventDefault();
            const resetemail = document.getElementById('resetEmail').value.trim();
    console.log('🔍 Debug - Email ingresado:', resetemail);
    
    // Verificar que la función existe
    if (typeof window.sendPasswordReset !== 'function') {
        console.error('❌ ERROR: sendPasswordReset no está definida en window');
        this.showNotification('Error de configuración. Recarga la página.', 'error');
        return;
    }
    
    console.log('✅ Función sendPasswordReset encontrada');
        
        const email = document.getElementById('resetEmail').value.trim();
        const resetText = document.getElementById('resetText');
        const resetSpinner = document.getElementById('resetSpinner');
        const resetSubmit = document.getElementById('forgotPasswordForm').querySelector('button[type="submit"]');
        
        if (!email) {
            this.showNotification('Por favor ingresa tu email', 'error');
            return;
        }
        
        // Validar formato email
        if (!this.isValidEmail(email)) {
            this.showNotification('Por favor ingresa un email válido', 'error');
            return;
        }
        
        // Mostrar loading
        resetText.style.display = 'none';
        resetSpinner.style.display = 'inline-block';
        resetSubmit.disabled = true;
        
        try {
            // Usar la función del firebase-config.js
            console.log('🔄 Ejecutando sendPasswordReset...');
            const result = await window.sendPasswordReset(email);
            console.log('📨 Resultado:', result);
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                this.closeModal('forgotPasswordModal');
                
                // Opcional: Mostrar mensaje de éxito extendido
                setTimeout(() => {
                    this.showNotification(
                        '💡 Si no ves el email, revisa tu carpeta de spam o promociones', 
                        'info'
                    );
                }, 3000);
                
            } else {
                this.showNotification(result.message, 'error');
            }
            
        } catch (error) {
            console.error('Error inesperado:', error);
            this.showNotification('Error inesperado. Intenta nuevamente.', 'error');
        } finally {
            // Restaurar botón
            resetText.style.display = 'inline-block';
            resetSpinner.style.display = 'none';
            resetSubmit.disabled = false;
        }
    }

    // ✅ NUEVO: Validar formato de email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
     



    async checkAuthState() {
        try {
            // Primero verificar con API
            if (window.ecoTagAPI?.authToken) {
                await this.handleAPIAuth();
                return;
            }
            
            // Fallback a Firebase
            if (window.firebaseApp?.auth) {
                this.handleFirebaseAuth();
                return;
            }
            
            // Mostrar interfaz de login
            this.showAuthUI(false);
            
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            this.showAuthUI(false);
        }
    }

    async handleAPIAuth() {
        try {
            const userData = await window.ecoTagAPI.getCurrentUser();
            this.currentUser = userData;
            this.showAuthUI(true);
            this.showNotification(`Bienvenido ${userData.name}`, 'success');
        } catch (error) {
            console.error('Error con API auth:', error);
            this.showAuthUI(false);
        }
    }

    handleFirebaseAuth() {
        window.firebaseApp.auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.showAuthUI(true);
                
                // Sincronizar con API si es necesario
                if (window.ecoTagAPI && !window.ecoTagAPI.authToken) {
                    this.syncFirebaseWithAPI(user);
                }
            } else {
                this.showAuthUI(false);
            }
        });
    }

    async syncFirebaseWithAPI(user) {
        try {
            const token = await user.getIdToken();
            window.ecoTagAPI.setAuthToken(token);
        } catch (error) {
            console.error('Error sincronizando con API:', error);
        }
    }

    showAuthUI(isAuthenticated) {
        document.body.setAttribute('data-auth', isAuthenticated);
        
        if (isAuthenticated) {
            document.querySelector('.auth-buttons').style.display = 'none';
            document.querySelector('.user-menu').style.display = 'block';
            document.getElementById('userEmail').textContent = this.currentUser.email || this.currentUser.name;
        } else {
            document.querySelector('.auth-buttons').style.display = 'flex';
            document.querySelector('.user-menu').style.display = 'none';
        }
    }

    // ===== AUTENTICACIÓN =====
    async handleLogin(e) {
        if (e) e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        this.showLoading(true);

        try {
            // Intentar con API primero
            if (window.ecoTagAPI) {
                const result = await window.ecoTagAPI.login(email, password);
                window.ecoTagAPI.setAuthToken(result.token);
                this.currentUser = result.user;
            } 
            // Fallback a Firebase
            else if (window.firebaseAuth) {
                const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
                const userCredential = await signInWithEmailAndPassword(window.firebaseApp.auth, email, password);
                this.currentUser = userCredential.user;
            } else {
                throw new Error('No hay sistema de autenticación disponible');
            }

            this.showNotification('Inicio de sesión exitoso', 'success');
            this.closeModal('loginModal');
            this.showAuthUI(true);
            
        } catch (error) {
            console.error('Error en login:', error);
            this.showNotification(this.getErrorMessage(error), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        if (e) e.preventDefault();
        
        const company = document.getElementById('registerCompany').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        if (!company || !email || !password) {
            this.showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        this.showLoading(true);

        try {
            if (window.ecoTagAPI) {
                const result = await window.ecoTagAPI.register({
                    company,
                    email,
                    password
                });
                window.ecoTagAPI.setAuthToken(result.token);
                this.currentUser = result.user;
            } else if (window.firebaseAuth) {
                const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
                const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
                
                const userCredential = await createUserWithEmailAndPassword(window.firebaseApp.auth, email, password);
                this.currentUser = userCredential.user;
                
                // Crear empresa en Firestore
                await setDoc(doc(window.firebaseApp.db, "companies", this.currentUser.uid), {
                    name: company,
                    email: email,
                    createdAt: new Date()
                });
            }

            this.showNotification('Registro exitoso. ¡Bienvenido!', 'success');
            this.closeModal('registerModal');
            this.showAuthUI(true);
            
        } catch (error) {
            console.error('Error en registro:', error);
            this.showNotification(this.getErrorMessage(error), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleLogout() {
        if (!confirm('¿Estás seguro de que quieres cerrar sesión?')) return;

        try {
            // Limpiar todo
            if (window.ecoTagAPI) {
                await window.ecoTagAPI.logout();
                window.ecoTagAPI.removeAuthToken();
            }
            
            if (window.firebaseApp?.auth) {
                await window.firebaseApp.auth.signOut();
            }
            
            localStorage.removeItem('authToken');
            this.currentUser = null;
            
            this.showNotification('Sesión cerrada correctamente', 'success');
            setTimeout(() => {
                this.showAuthUI(false);
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('Error en logout:', error);
            // Forzar logout de todas formas
            this.currentUser = null;
            this.showAuthUI(false);
            window.location.reload();
        }
    }

    // ===== SCANNER =====
    async startCamera() {
        try {
            if (this.stream) {
                this.stopCamera();
            }

            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = document.getElementById('scanner-video');
            
            video.srcObject = this.stream;
            video.classList.add('active');
            document.getElementById('camera-view').classList.add('hidden');
            
            document.getElementById('capture-btn').disabled = false;
            document.getElementById('switch-camera').disabled = false;
            document.getElementById('start-camera').disabled = true;
            
            this.showNotification('Cámara activada', 'success');
            
        } catch (error) {
            console.error('Error accediendo a la cámara:', error);
            this.showNotification('No se pudo acceder a la cámara', 'error');
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        const video = document.getElementById('scanner-video');
        if (video) {
            video.srcObject = null;
            video.classList.remove('active');
        }
        
        document.getElementById('camera-view').classList.remove('hidden');
        document.getElementById('capture-btn').disabled = true;
        document.getElementById('switch-camera').disabled = true;
        document.getElementById('start-camera').disabled = false;
    }

    captureImage() {
        const video = document.getElementById('scanner-video');
        const canvas = document.getElementById('scanner-canvas');
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        this.processImage(canvas.toDataURL('image/jpeg'));
    }

    async processImage(imageData) {
        this.showNotification('Analizando producto...', 'info');
        
        try {
            // Simular análisis (en producción sería una llamada a la API)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const mockProduct = {
                name: "Botella de Agua Mineral",
                brand: "AguaPure",
                sustainabilityScore: 65,
                recommendations: [
                    "Reducir plástico de un solo uso",
                    "Utilizar proveedores locales",
                    "Optimizar transporte"
                ]
            };
            
            this.showScanResult(mockProduct);
            
            // Guardar en base de datos si está autenticado
            if (this.currentUser && window.ecoTagAPI) {
                await window.ecoTagAPI.createScan({
                    productName: mockProduct.name,
                    brand: mockProduct.brand,
                    score: mockProduct.sustainabilityScore,
                    image: imageData
                });
            }
            
        } catch (error) {
            console.error('Error procesando imagen:', error);
            this.showNotification('Error analizando el producto', 'error');
        }
    }

    showScanResult(product) {
        const result = document.getElementById('scanResult');
        const scoreFill = document.getElementById('scoreFill');
        const productName = document.getElementById('productName');
        const scoreValue = document.getElementById('scoreValue');
        const improvementList = document.getElementById('improvementList');

        productName.textContent = product.name;
        scoreValue.textContent = `${product.sustainabilityScore}%`;
        
        setTimeout(() => {
            scoreFill.style.width = `${product.sustainabilityScore}%`;
        }, 100);

        improvementList.innerHTML = '';
        product.recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-lightbulb"></i> ${rec}`;
            improvementList.appendChild(li);
        });

        result.classList.add('active');
        this.showNotification('Análisis completado', 'success');
    }

    switchCamera() {
        this.stopCamera();
        setTimeout(() => this.startCamera(), 500);
    }

    // ===== UTILIDADES =====
    showNotification(message, type = 'success') {
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

    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Limpiar formularios
        const form = document.querySelector(`#${modalId} form`);
        if (form) form.reset();
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

        getErrorMessage(error) {
        const messages = {
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/email-already-in-use': 'El email ya está registrado',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
            'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
            'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
            // ✅ NUEVOS: Errores de recuperación
            'auth/invalid-email': 'Email inválido',
            'auth/missing-email': 'Por favor ingresa tu email',
            'auth/operation-not-allowed': 'Operación no permitida. Contacta soporte.'
        };
        
        return messages[error.code] || error.message || 'Error desconocido';
    }

    handleStart() {
        if (this.currentUser) {
            window.location.href = 'dashboard.html';
        } else {
            this.openModal('registerModal');
        }
    }

    showDemo() {
        this.showNotification('Modo demo activado', 'info');
        document.getElementById('scanner').scrollIntoView({ behavior: 'smooth' });
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    // Ocultar loading inicial
    setTimeout(() => {
        document.getElementById('loadingOverlay').style.display = 'none';
    }, 1000);

    // Inicializar aplicación
    window.ecoTagApp = new EcoTagApp();
});

// Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('SW registrado:', registration);
            })
            .catch(error => {
                console.log('Error SW:', error);
            });
    });
}