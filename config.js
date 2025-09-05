// config.js - Configuración de entornos CORREGIDA
const ENVIRONMENTS = {
    development: {
        apiUrl: 'http://localhost:3000/api',
        websocketUrl: 'ws://localhost:3000',
        debug: true,
        useMockAPI: true
    },
    staging: {
        apiUrl: 'https://staging.api.ecotag.com',
        websocketUrl: 'wss://staging.api.ecotag.com',
        debug: true,
        useMockAPI: false
    },
    production: {
        apiUrl: 'https://api.ecotag.com',
        websocketUrl: 'wss://api.ecotag.com',
        debug: false,
        useMockAPI: false
    }
};

// Determinar el entorno automáticamente con detección mejorada
const getEnvironment = () => {
    const hostname = window.location.hostname;
    
    // Si estamos en localhost o una IP local
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
        return 'development';
    }
    
    // Si estamos en un dominio de desarrollo
    if (hostname.includes('dev.') || hostname.includes('local.')) {
        return 'development';
    }
    
    // Si estamos en staging
    if (hostname.includes('staging.') || hostname.includes('test.')) {
        return 'staging';
    }
    
    // Para todos los demás casos, asumimos producción
    return 'production';
};

// Función para forzar un entorno específico via URL parameter
const getEnvironmentFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('env');
};

// Obtener el entorno
let environment = getEnvironmentFromURL() || getEnvironment();

// Validar que el entorno sea válido
if (!ENVIRONMENTS[environment]) {
    console.warn(`Entorno "${environment}" no válido, usando development por defecto`);
    environment = 'development';
}

const config = ENVIRONMENTS[environment];

// Si useMockAPI es true, cargar el mock
if (config.useMockAPI) {
    // Crear script para api-mock
    const mockScript = document.createElement('script');
    mockScript.src = 'api-mock.js';
    document.head.appendChild(mockScript);
    
    console.log('Usando API mock para desarrollo');
} else {
    console.log(`Conectando a API real: ${config.apiUrl}`);
}

// Hacer config disponible globalmente
window.APP_CONFIG = config;

console.log(`Entorno: ${environment}, API: ${config.apiUrl}, Mock: ${config.useMockAPI}`);