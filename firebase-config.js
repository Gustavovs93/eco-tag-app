// firebase-config.js
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

const initializeFirebase = async () => {
    if (firebaseInitialized) return;
    
    try {
        // Cargar Firebase solo cuando se necesite
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
        const { 
            getAuth, 
            setPersistence, 
            browserLocalPersistence,
            sendPasswordResetEmail  // ✅ NUEVO - Importar función de reset
        } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        // Configurar persistencia
        await setPersistence(auth, browserLocalPersistence);

        window.firebaseApp = { app, auth, db };
        firebaseInitialized = true;
        
        console.log('✅ Firebase inicializado en modo producción');
        
    } catch (error) {
        console.error('❌ Error inicializando Firebase:', error);
        throw error;
    }
};

// ✅ NUEVA FUNCIÓN: Recuperación de contraseña
const sendPasswordReset = async (email) => {
    try {
        if (!window.firebaseApp?.auth) {
            await initializeFirebase();
        }
        
        const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
        await sendPasswordResetEmail(window.firebaseApp.auth, email);
        
        return { 
            success: true, 
            message: 'Email de recuperación enviado. Revisa tu bandeja de entrada.' 
        };
        
    } catch (error) {
        console.error('❌ Error enviando email de recuperación:', error);
        
        // Mensajes de error específicos
        const errorMessages = {
            'auth/invalid-email': 'El formato del email es inválido',
            'auth/user-not-found': 'No existe una cuenta con este email',
            'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
            'auth/network-request-failed': 'Error de conexión. Verifica tu internet.'
        };
        
        return { 
            success: false, 
            message: errorMessages[error.code] || 'Error al enviar el email de recuperación' 
        };
    }
};

// Exportar para uso global
window.initializeFirebase = initializeFirebase;
window.firebaseConfig = firebaseConfig;
window.sendPasswordReset = sendPasswordReset;  // ✅ NUEVO - Exportar función