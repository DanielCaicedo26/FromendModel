// Configuración de la API
const API_BASE_URL = 'https://localhost:7182/api';
const AUTH_URL = `${API_BASE_URL}/Auth`;
const USER_URL = `${API_BASE_URL}/User`;
const PERSON_URL = `${API_BASE_URL}/Person`;

// Claves para almacenamiento local
const TOKEN_KEY = 'jwt_token';
const USER_DATA_KEY = 'user_data';

// Referencias a elementos del DOM
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Elementos del formulario de login
const loginButton = document.getElementById('login-button');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const loginSuccess = document.getElementById('login-success');

// Elementos del formulario de registro
const registerButton = document.getElementById('register-button');
const firstName = document.getElementById('firstName');
const lastName = document.getElementById('lastName');
const documentType = document.getElementById('documentType');
const documentNumber = document.getElementById('documentNumber');
const phone = document.getElementById('phone');
const registerUsername = document.getElementById('register-username');
const email = document.getElementById('email');
const registerPassword = document.getElementById('register-password');
const confirmPassword = document.getElementById('confirmPassword');
const registerError = document.getElementById('register-error');
const registerSuccess = document.getElementById('register-success');

// Cambiar entre pestañas
loginTab.addEventListener('click', function() {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    // Limpiar mensajes al cambiar de pestaña
    clearMessages();
});

registerTab.addEventListener('click', function() {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
    // Limpiar mensajes al cambiar de pestaña
    clearMessages();
});

// Limpiar mensajes de error y éxito
function clearMessages() {
    loginError.textContent = '';
    loginSuccess.textContent = '';
    registerError.textContent = '';
    registerSuccess.textContent = '';
}

// Verificar si el usuario ya está autenticado
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        validateToken(token).then(isValid => {
            if (isValid) {
                window.location.href = 'person.html';
            } else {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_DATA_KEY);
            }
        });
    }
});

// Función para validar el token JWT
async function validateToken(token) {
    try {
        const response = await fetch(`${AUTH_URL}/validate`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Error al validar token:', error);
        return false;
    }
}

// Manejar el inicio de sesión
loginButton.addEventListener('click', async function() {
    // Limpiar mensajes previos
    loginError.textContent = '';
    loginSuccess.textContent = '';
    
    // Validar campos
    if (!loginUsername.value || !loginPassword.value) {
        loginError.textContent = 'Por favor ingrese usuario y contraseña';
        return;
    }
    
    // Mostrar estado de carga
    loginForm.classList.add('loading');
    loginButton.disabled = true;
    
    try {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: loginUsername.value,
                password: loginPassword.value
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Credenciales incorrectas');
        }
        
        const data = await response.json();
        
        // Verificar que se recibió un token
        if (!data.token) {
            throw new Error('No se recibió un token de autenticación válido');
        }
        
        // Guardar token y datos del usuario
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
        
        loginSuccess.textContent = 'Inicio de sesión exitoso. Redirigiendo...';
        
        // Redirigir al dashboard
        setTimeout(() => {
            window.location.href = 'person.html';
        }, 1500);
        
    } catch (error) {
        loginError.textContent = error.message || 'Error al iniciar sesión. Intente nuevamente.';
    } finally {
        loginForm.classList.remove('loading');
        loginButton.disabled = false;
    }
});

// Función para manejar errores de la API
async function handleApiError(response) {
    if (!response.ok) {
        try {
            const errorData = await response.json();
            return errorData.message || 'Error del servidor';
        } catch (error) {
            return response.statusText || 'Error desconocido';
        }
    }
    return null;
}

// Manejar el registro de usuario
registerButton.addEventListener('click', async function() {
    // Limpiar mensajes previos
    registerError.textContent = '';
    registerSuccess.textContent = '';
    
    // Validar campos obligatorios
    if (!firstName.value || !lastName.value || !documentNumber.value || 
        !registerUsername.value || !email.value || !registerPassword.value) {
        registerError.textContent = 'Por favor complete todos los campos obligatorios';
        return;
    }
    
    // Validar que las contraseñas coincidan
    if (registerPassword.value !== confirmPassword.value) {
        registerError.textContent = 'Las contraseñas no coinciden';
        return;
    }
    
    // Validar longitud de contraseña
    if (registerPassword.value.length < 6) {
        registerError.textContent = 'La contraseña debe tener al menos 6 caracteres';
        return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        registerError.textContent = 'Por favor ingrese un correo electrónico válido';
        return;
    }
    
    // Mostrar estado de carga
    registerForm.classList.add('loading');
    registerButton.disabled = true;
    
    try {
        // Datos de registro
        const registerData = {
            username: registerUsername.value,
            email: email.value,
            password: registerPassword.value,
            confirmPassword: confirmPassword.value,
            firstName: firstName.value,
            lastName: lastName.value,
            documentType: documentType.value || 'CC',
            documentNumber: documentNumber.value,
            phone: phone.value || ''
        };
        
        // Llamar al endpoint de registro
        const response = await fetch(`${AUTH_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });
        
        // Verificar respuesta
        if (!response.ok) {
            const errorMessage = await handleApiError(response);
            throw new Error(errorMessage);
        }
        
        // Registro exitoso
        registerSuccess.textContent = 'Registro exitoso. Ya puede iniciar sesión';
        
        // Limpiar el formulario
        document.getElementById('register-form').reset();
        
        // Cambiar a la pestaña de login después de un momento
        setTimeout(() => {
            loginTab.click();
        }, 2000);
        
    } catch (error) {
        registerError.textContent = error.message || 'Error al registrarse. Intente nuevamente.';
    } finally {
        registerForm.classList.remove('loading');
        registerButton.disabled = false;
    }
});

// Enviar formulario con Enter
loginPassword.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        loginButton.click();
    }
});

confirmPassword.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        registerButton.click();
    }
});