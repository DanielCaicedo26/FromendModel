// auth.js - Manejo centralizado de autenticación

// Función para verificar sesión en cada página
function checkSession() {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    const currentPage = window.location.pathname;
    const isAdmin = localStorage.getItem(API_CONFIG.IS_ADMIN_KEY) === 'true';
    
    // Si estamos en la página de login, no hacer nada
    if (currentPage.includes('inico.html')) {
        return;
    }
    
    // Si no hay token y no estamos en la página de login, redirigir
    if (!token) {
        window.location.href = 'inico.html';
        return;
    }
    
    // Verificar acceso basado en rol
    if (currentPage.includes('/admin/') && !isAdmin) {
        // Si intenta acceder a una página de admin sin ser admin, redirigir
        window.location.href = '/user/dashboard.html';
        return;
    }
    
    if (currentPage.includes('/user/') && isAdmin) {
        // Si un admin accede a una página de usuario regular, redirigir (opcional)
        // window.location.href = '/admin/dashboard.html';
        // return;
    }
    
    // Mostrar información del usuario si hay token
    displayUserInfo();
}

// Función para obtener datos del usuario
function getUserData() {
    const userData = localStorage.getItem(API_CONFIG.USER_DATA_KEY); // Corregido
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
            const token = localStorage.getItem(API_CONFIG.TOKEN_KEY); // Corregido
            
            // Llamar al endpoint de logout (si existe)
            if (token) {
                fetch(`${API_CONFIG.AUTH_URL}/logout`, { // Corregido
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }).catch(error => {
                    console.error('Error durante el logout:', error);
                }).finally(() => {
                    // Siempre limpiar localStorage y redirigir
                    localStorage.removeItem(API_CONFIG.TOKEN_KEY); // Corregido
                    localStorage.removeItem(API_CONFIG.USER_DATA_KEY); // Corregido
                    localStorage.removeItem(API_CONFIG.IS_ADMIN_KEY); // Corregido
                    window.location.href = 'inico.html';
                });
            } else {
                // Si no hay token, simplemente redirigir
                localStorage.removeItem(API_CONFIG.TOKEN_KEY); // Corregido
                localStorage.removeItem(API_CONFIG.USER_DATA_KEY); // Corregido
                localStorage.removeItem(API_CONFIG.IS_ADMIN_KEY); // Corregido
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