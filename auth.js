// auth.js - Manejo de autenticación para Eco Tag

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authToken = null;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.updateAuthUI();
    }

    loadFromStorage() {
        this.authToken = localStorage.getItem('authToken');
        this.currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    }

    saveToStorage() {
        if (this.authToken) {
            localStorage.setItem('authToken', this.authToken);
        }
        if (this.currentUser) {
            localStorage.setItem('user', JSON.stringify(this.currentUser));
        }
    }

    async login(credentials) {
        try {
            const result = await EcoTagAPI.login(credentials);
            
            if (result.success) {
                this.authToken = result.data.token;
                this.currentUser = result.data.user;
                this.saveToStorage();
                this.updateAuthUI();
                
                return { success: true, message: result.message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async register(userData) {
        try {
            const result = await EcoTagAPI.register(userData);
            
            if (result.success) {
                this.authToken = result.data.token;
                this.currentUser = result.data.user;
                this.saveToStorage();
                this.updateAuthUI();
                
                return { success: true, message: result.message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    logout() {
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.updateAuthUI();
        
        // Redirigir al home si estamos en página protegida
        if (window.location.pathname.includes('products.html') || 
            window.location.pathname.includes('scans.html')) {
            window.location.href = 'index.html';
        }
    }

    isAuthenticated() {
        return !!(this.authToken && this.currentUser);
    }

    isAdmin() {
        return this.isAuthenticated() && this.currentUser.role === 'admin';
    }

    updateAuthUI() {
        // Actualizar botones de login/logout
        const loginButtons = document.querySelectorAll('#loginBtn, .login-btn');
        const userButtons = document.querySelectorAll('#userBtn, .user-btn');
        const logoutButtons = document.querySelectorAll('.logout-btn');

        if (this.isAuthenticated()) {
            loginButtons.forEach(btn => {
                btn.textContent = 'Cerrar Sesión';
                btn.onclick = () => this.logout();
            });
            
            userButtons.forEach(btn => {
                btn.textContent = this.currentUser.company;
                btn.style.background = '#27ae60';
            });

            logoutButtons.forEach(btn => {
                btn.style.display = 'block';
            });

            // Mostrar elementos protegidos
            document.querySelectorAll('.protected').forEach(el => {
                el.style.display = 'block';
            });

            // Mostrar elementos de admin si es admin
            if (this.isAdmin()) {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = 'block';
                });
            }
        } else {
            loginButtons.forEach(btn => {
                btn.textContent = 'Iniciar Sesión';
                btn.onclick = null;
            });
            
            userButtons.forEach(btn => {
                btn.textContent = 'Registrarse';
                btn.style.background = '';
            });

            logoutButtons.forEach(btn => {
                btn.style.display = 'none';
            });

            // Ocultar elementos protegidos
            document.querySelectorAll('.protected').forEach(el => {
                el.style.display = 'none';
            });

            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'none';
            });
        }
    }

    getToken() {
        return this.authToken;
    }

    getUser() {
        return this.currentUser;
    }
}

// Crear instancia global
window.authManager = new AuthManager();