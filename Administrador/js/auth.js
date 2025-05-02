// auth.js - Manejo centralizado de autenticación

// Configuración de la API
const API_BASE_URL = 'https://localhost:7182/api';
const AUTH_URL = `${API_BASE_URL}/Auth`;

// Claves consistentes para almacenamiento local
const TOKEN_KEY = 'jwt_token';
const USER_DATA_KEY = 'user_data';

// Función para verificar sesión en cada página
function checkSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    const currentPage = window.location.pathname;
    
    // Si estamos en la página de login, no hacer nada
    if (currentPage.includes('inico.html')) {
        return;
    }
    
    // Si no hay token y no estamos en la página de login, redirigir
    if (!token) {
        window.location.href = 'inico.html';
        return;
    }
    
    // Mostrar información del usuario si hay token
    displayUserInfo();
}

// Función para obtener datos del usuario
function getUserData() {
    const userData = localStorage.getItem(USER_DATA_KEY);
    if (userData) {
        return JSON.parse(userData);
    }
    return null;
}

// Función para mostrar información del usuario
function displayUserInfo() {
    const userData = getUserData();
    const userNameElement = document.getElementById('currentUserName');
    
    if (userData && userNameElement) {
        userNameElement.textContent = userData.username || 'Usuario';
    }
}

// Función para cerrar sesión
function logout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Mostrar indicador de carga si hay un elemento de mensaje
            const statusMessage = document.getElementById('statusMessage');
            if (statusMessage) {
                statusMessage.className = 'alert alert-info';
                statusMessage.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cerrando sesión...';
                statusMessage.style.display = 'block';
            }
            
            // Obtener el token
            const token = localStorage.getItem(TOKEN_KEY);
            
            // Llamar al endpoint de logout (si existe)
            if (token) {
                fetch(`${AUTH_URL}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }).catch(error => {
                    console.error('Error durante el logout:', error);
                }).finally(() => {
                    // Siempre limpiar localStorage y redirigir
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(USER_DATA_KEY);
                    window.location.href = 'inico.html';
                });
            } else {
                // Si no hay token, simplemente redirigir
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_DATA_KEY);
                window.location.href = 'inico.html';
            }
        });
    }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    logout();
});