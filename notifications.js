// notifications.js - Sistema de notificaciones mejorado
class NotificationSystem {
    constructor() {
        this.notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.updateNotificationBadge();
        
        // Solo conectar WebSocket si la URL está configurada y no es localhost
        if (window.APP_CONFIG.websocketUrl && !window.APP_CONFIG.websocketUrl.includes('localhost')) {
            this.setupWebSocket();
        } else {
            console.log('WebSocket deshabilitado para entorno local');
        }
    }
    
    setupWebSocket() {
        if (!window.APP_CONFIG.websocketUrl || this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('WebSocket deshabilitado o máximo de intentos alcanzado');
            return;
        }
        
        try {
            console.log(`Intentando conectar WebSocket a: ${window.APP_CONFIG.websocketUrl}`);
            this.socket = new WebSocket(window.APP_CONFIG.websocketUrl);
            
            this.socket.onopen = () => {
                console.log('Conexión WebSocket establecida');
                this.reconnectAttempts = 0; // Resetear contador de reconexión
                
                // Autenticar si hay token
                if (window.ecoTagAPI && window.ecoTagAPI.authToken) {
                    this.socket.send(JSON.stringify({
                        type: 'auth',
                        token: window.ecoTagAPI.authToken
                    }));
                }
            };
            
            this.socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    
                    if (message.type === 'notification') {
                        this.addNotification(message.data);
                    }
                } catch (error) {
                    console.error('Error procesando mensaje WebSocket:', error);
                }
            };
            
            this.socket.onclose = (event) => {
                console.log(`Conexión WebSocket cerrada. Código: ${event.code}, Razón: ${event.reason}`);
                
                // Intentar reconectar con backoff exponencial
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
                    console.log(`Reintentando en ${delay}ms... (Intento ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
                    
                    setTimeout(() => {
                        this.reconnectAttempts++;
                        this.setupWebSocket();
                    }, delay);
                }
            };
            
            this.socket.onerror = (error) => {
                console.error('Error en WebSocket:', error);
            };
            
        } catch (error) {
            console.error('Error inicializando WebSocket:', error);
        }
    }
    
    addNotification(notificationData) {
        const notification = {
            id: Date.now() + Math.random().toString(36).substr(2, 5),
            type: notificationData.type || 'info',
            title: notificationData.title || 'Notificación',
            message: notificationData.message,
            timestamp: new Date().toISOString(),
            read: false,
            data: notificationData.data || null
        };
        
        this.notifications.unshift(notification);
        this.unreadCount++;
        
        this.saveNotifications();
        this.updateNotificationBadge();
        
        // Mostrar notificación toast
        if (this.shouldShowToast(notification)) {
            showNotification(notification.message, notification.type);
        }
    }
    
    shouldShowToast(notification) {
        // No mostrar toasts para notificaciones silenciosas
        if (notification.type === 'silent') return false;
        
        // No mostrar toasts si la página no está visible
        if (document.hidden) return false;
        
        return true;
    }
    
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.read) {
            notification.read = true;
            this.unreadCount--;
            this.saveNotifications();
            this.updateNotificationBadge();
        }
    }
    
    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.unreadCount = 0;
        this.saveNotifications();
        this.updateNotificationBadge();
    }
    
    updateNotificationBadge() {
        const badges = document.querySelectorAll('.notification-badge');
        badges.forEach(badge => {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }
    
    saveNotifications() {
        // Mantener sólo las 100 notificaciones más recientes
        if (this.notifications.length > 100) {
            this.notifications = this.notifications.slice(0, 100);
        }
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }
    
    getNotifications() {
        return this.notifications;
    }
    
    getUnreadCount() {
        return this.unreadCount;
    }
    
    // Método para simular notificaciones en desarrollo
    simulateNotification(type = 'info') {
        if (window.APP_CONFIG.useMockAPI) {
            const messages = {
                info: { title: 'Información', message: 'Esta es una notificación de prueba' },
                success: { title: 'Éxito', message: 'Operación completada correctamente' },
                warning: { title: 'Advertencia', message: 'Algo requiere tu atención' },
                error: { title: 'Error', message: 'Ha ocurrido un problema' }
            };
            
            this.addNotification({
                type: type,
                title: messages[type].title,
                message: messages[type].message,
                data: { simulated: true }
            });
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si no estamos en un entorno de producción real
    if (window.APP_CONFIG.useMockAPI || window.APP_CONFIG.debug) {
        window.notificationSystem = new NotificationSystem();
        
        // Simular una notificación después de 3 segundos para demostración
        setTimeout(() => {
            window.notificationSystem.simulateNotification('success');
        }, 3000);
    }
});