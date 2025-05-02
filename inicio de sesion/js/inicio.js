// Tab switching functionality
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

loginTab.addEventListener('click', function() {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
});

registerTab.addEventListener('click', function() {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
});

// API URL - Configura la URL base de tu API backend
const API_BASE_URL = 'https://localhost:7182/api';
const AUTH_URL = `${API_BASE_URL}/Auth`;
const USER_URL = `${API_BASE_URL}/User`;
const PERSON_URL = `${API_BASE_URL}/Person`;

// JWT Token management
const TOKEN_KEY = 'jwt_token';
const USER_DATA_KEY = 'user_data';

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        // Validar el token antes de redirigir
        validateToken(token).then(isValid => {
            if (isValid) {
                window.location.href = '/dashboard.html';
            } else {
                // Token inválido, eliminarlo
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
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Error validando token:', error);
        return false;
    }
}

// Login functionality
const loginButton = document.getElementById('login-button');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const loginSuccess = document.getElementById('login-success');
const loginSpinner = document.getElementById('login-spinner');

loginButton.addEventListener('click', async function() {
    // Reset messages
    loginError.textContent = '';
    loginSuccess.textContent = '';
    
    // Validate input
    if (!loginUsername.value || !loginPassword.value) {
        loginError.textContent = 'Por favor ingrese usuario y contraseña';
        return;
    }
    
    // Show loading state
    loginForm.classList.add('loading');
    loginButton.disabled = true;
    
    try {
        // Realizar la llamada a la API de login
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
            throw new Error(errorData.message || 'Credenciales inválidas');
        }
        
        const data = await response.json();
        
        // Verificar que se recibió un token
        if (!data.token) {
            throw new Error('No se recibió token de autenticación');
        }
        
        // Guardar el token y los datos del usuario
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
        
        loginSuccess.textContent = 'Inicio de sesión exitoso. Redirigiendo...';
        
        // Redirigir al dashboard
        setTimeout(() => {
            window.location.href = '/dashboard.html';
        }, 1000);
        
    } catch (error) {
        loginError.textContent = error.message || 'Error al iniciar sesión. Intente nuevamente.';
    } finally {
        // Hide loading state
        loginForm.classList.remove('loading');
        loginButton.disabled = false;
    }
});

// Función para analizar errores de la API
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

// Registration functionality
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
const registerSpinner = document.getElementById('register-spinner');

registerButton.addEventListener('click', async function() {
    // Reset messages
    registerError.textContent = '';
    registerSuccess.textContent = '';
    
    // Validate input
    if (!firstName.value || !lastName.value || !documentNumber.value || 
        !registerUsername.value || !email.value || !registerPassword.value) {
        registerError.textContent = 'Por favor complete todos los campos obligatorios';
        return;
    }
    
    if (registerPassword.value !== confirmPassword.value) {
        registerError.textContent = 'Las contraseñas no coinciden';
        return;
    }
    
    // Validaciones adicionales
    if (registerPassword.value.length < 6) {
        registerError.textContent = 'La contraseña debe tener al menos 6 caracteres';
        return;
    }
    
    // Validar formato de email con regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        registerError.textContent = 'Por favor ingrese un correo electrónico válido';
        return;
    }
    
    // Show loading state
    registerForm.classList.add('loading');
    registerButton.disabled = true;
    
    try {
        // Implementación completa del registro usando el endpoint /register
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
        
        // Verificar si hubo errores
        if (!response.ok) {
            const errorMessage = await handleApiError(response);
            throw new Error(errorMessage);
        }
        
        // Procesar respuesta exitosa
        registerSuccess.textContent = 'Registro exitoso. Ahora puede iniciar sesión.';
        
        // Limpiar el formulario después del registro exitoso
        document.getElementById('register-form').reset();
        
        // Cambiar a la pestaña de login
        loginTab.click();
        
    } catch (error) {
        registerError.textContent = error.message || 'Error al registrarse. Intente nuevamente.';
    } finally {
        // Hide loading state
        registerForm.classList.remove('loading');
        registerButton.disabled = false;
    }
});

// Añadir keypress para enviar formulario con Enter
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