// logout.js - Funcionalidad para cerrar sesión

// Configuración de la API
const API_BASE_URL = 'https://localhost:7182/api';
const AUTH_URL = `${API_BASE_URL}/Auth`;

// Claves para almacenamiento local
const TOKEN_KEY = 'jwt_token';
const USER_DATA_KEY = 'user_data';

// Referencias a elementos del DOM
const logoutBtn = document.getElementById('logoutBtn');
const currentUserNameElement = document.getElementById('currentUserName');

// Función para obtener datos del usuario actual desde localStorage
function getCurrentUser() {
    try {
        // Intentar obtener y parsear el usuario desde localStorage
        const userString = localStorage.getItem(USER_DATA_KEY);
        if (userString) {
            return JSON.parse(userString);
        }
        return null;
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        return null;
    }
}

// Función para mostrar el nombre del usuario actual
function displayCurrentUser() {
    const user = getCurrentUser();
    if (user && user.username) {
        currentUserNameElement.textContent = user.username;
    } else {
        currentUserNameElement.textContent = 'Usuario';
    }
}

// Función para cerrar sesión
function logout() {
    // Mostrar indicador de carga
    showMessage('<i class="fas fa-spinner fa-spin"></i> Cerrando sesión...', 'info');
    
    // Obtener el token de autenticación
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!token) {
        // Si no hay token, simplemente redirigir al login
        handleLogoutSuccess();
        return;
    }
    
    // Llamar al endpoint de logout en la API (si existe)
    fetch(`${AUTH_URL}/logout`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        // Independientemente de la respuesta, realizar el logout del lado del cliente
        handleLogoutSuccess();
    })
    .catch(error => {
        console.error('Error durante el logout:', error);
        // A pesar del error, realizar el logout del lado del cliente
        handleLogoutSuccess();
    });
}

// Manejar el éxito del logout
function handleLogoutSuccess() {
    // Limpiar localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    
    // Mostrar mensaje de éxito
    showMessage('<i class="fas fa-check-circle"></i> Sesión cerrada correctamente', 'success');
    
    // Redirigir al login después de un breve retraso
    setTimeout(() => {
        window.location.href = 'inico.html';
    }, 1500);
}

// Función para mostrar mensajes (reutilizada del código principal)
function showMessage(message, type = 'info') {
    const statusMessage = document.getElementById('statusMessage');
    if (!statusMessage) {
        console.error('Elemento de mensaje no encontrado');
        return;
    }
    
    statusMessage.className = `alert alert-${type}`;
    statusMessage.innerHTML = message;
    statusMessage.style.display = 'block';
    
    // Ocultar mensaje después de 5 segundos si no es un error
    if (type !== 'danger') {
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar el nombre del usuario actual
    displayCurrentUser();
    
    // Verificar si hay una sesión activa
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        // Si no hay token, redirigir al login
        window.location.href = 'inico.html';
        return;
    }
    
    // Agregar event listener al botón de logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    } else {
        console.error('Botón de logout no encontrado');
    }
});