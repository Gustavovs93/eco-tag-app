// firebase-config.js - VERSIÓN CORREGIDA
const firebaseConfig = {
    apiKey: "AIzaSyDpBbiM_ALSLLhfJBDXDWOd6H_Gh3THqSs",
    authDomain: "ecotag-app-c53c2.firebaseapp.com",
    projectId: "ecotag-app-c53c2",
    storageBucket: "ecotag-app-c53c2.firebasestorage.app",
    messagingSenderId: "1023701046944",
    appId: "1:1023701046944:web:0fa7c98dbcae3551c0dbc5"
};

// Inicialización diferida de Firebase
let firebaseInitialized = false;
let initializationPromise = null;

const initializeFirebase = async () => {
    if (firebaseInitialized) {
        console.log('✅ Firebase ya está inicializado');
        return window.firebaseApp;
    }
    
    if (initializationPromise) {
        console.log('🔄 Firebase ya se está inicializando...');
        return initializationPromise;
    }
    
    initializationPromise = (async () => {
        try {
            console.log('🚀 Inicializando Firebase...');
            
            // Cargar Firebase modules
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
            const { 
                getAuth, 
                setPersistence, 
                browserLocalPersistence
            } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
            const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

            // Inicializar Firebase
            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const db = getFirestore(app);

            // Configurar persistencia
            await setPersistence(auth, browserLocalPersistence);

            // Guardar en window para acceso global
            window.firebaseApp = { app, auth, db };
            window.firebaseAuth = auth;
            firebaseInitialized = true;
            
            console.log('✅ Firebase inicializado correctamente');
            return window.firebaseApp;
            
        } catch (error) {
            console.error('❌ Error inicializando Firebase:', error);
            initializationPromise = null;
            throw error;
        }
    })();
    
    return initializationPromise;
};

// Función de recuperación de contraseña
const sendPasswordReset = async (email) => {
    try {
        console.log('🔄 Iniciando recuperación para:', email);
        
        // Asegurar que Firebase esté inicializado
        if (!window.firebaseApp?.auth) {
            console.log('⚠️ Firebase no inicializado, inicializando...');
            await initializeFirebase();
        }
        
        // Importar función específica
        const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
        
        console.log('📧 Enviando email de recuperación...');
        await sendPasswordResetEmail(window.firebaseApp.auth, email);
        
        console.log('✅ Email enviado correctamente');
        return { 
            success: true, 
            message: '📧 Email de recuperación enviado. Revisa tu bandeja de entrada.' 
        };
        
    } catch (error) {
        console.error('❌ Error en sendPasswordReset:', error);
        
        const errorMessages = {
            'auth/invalid-email': '❌ El formato del email es inválido',
            'auth/user-not-found': '❌ No existe una cuenta con este email',
            'auth/missing-email': '❌ Por favor ingresa tu email',
            'auth/too-many-requests': '❌ Demasiados intentos. Intenta más tarde.',
            'auth/network-request-failed': '❌ Error de conexión. Verifica tu internet.',
            'auth/operation-not-allowed': '❌ Operación no permitida. Contacta soporte.'
        };
        
        return { 
            success: false, 
            message: errorMessages[error.code] || `❌ Error: ${error.message}` 
        };
    }
};

// Exportar para uso global (sin modules)
window.firebaseConfig = firebaseConfig;
window.initializeFirebase = initializeFirebase;
window.sendPasswordReset = sendPasswordReset;

console.log('✅ firebase-config.js cargado correctamente');