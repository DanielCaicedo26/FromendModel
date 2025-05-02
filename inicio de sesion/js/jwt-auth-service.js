// jwt-auth-service.js - Servicio de autenticación con JWT

/**
 * Configuración del servicio de API para autenticación JWT
 */
const ApiConfig = {
    // URL base para peticiones API - reemplaza con la URL de tu backend
    baseUrl: 'https://localhost:7182/api/',
    
    // Endpoints de autenticación
    endpoints: {
        login: '/auth/login',
        register: '/auth/register',
        validateToken: '/auth/validate',
        person: '/person',
        user: '/user'
    },
    
    // Cabeceras de petición por defecto
    headers: {
        'Content-Type': 'application/json'
    },
    
    // Clave para almacenar el token JWT
    tokenKey: 'jwt_token',
    
    // Clave para almacenar los datos del usuario
    userDataKey: 'user_data',
    
    // Tiempo de expiración del token en milisegundos (por defecto 1 hora)
    tokenExpiration: 3600000
};

/**
 * Clase para gestionar la autenticación con JWT
 */
class JwtAuthService {
    /**
     * Inicializa el servicio de autenticación y verifica si hay un token existente
     */
    constructor() {
        this.token = localStorage.getItem(ApiConfig.tokenKey);
        this.userData = JSON.parse(localStorage.getItem(ApiConfig.userDataKey) || '{}');
        this.tokenExpiration = localStorage.getItem('token_expiration');
        
        // Verificar expiración del token si existe
        if (this.token && this.tokenExpiration) {
            if (new Date().getTime() > parseInt(this.tokenExpiration)) {
                this.logout(); // Logout automático si el token ha expirado
            }
        }
    }
    
    /**
     * Realiza el login del usuario y guarda el token JWT
     * @param {string} username - Nombre de usuario
     * @param {string} password - Contraseña
     * @returns {Promise<Object>} - Datos del usuario y token
     */
    async login(username, password) {
        try {
            const response = await fetch(`${ApiConfig.baseUrl}${ApiConfig.endpoints.login}`, {
                method: 'POST',
                headers: ApiConfig.headers,
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Credenciales inválidas');
            }
            
            const data = await response.json();
            
            // Validar que se recibió un token
            if (!data.token) {
                throw new Error('No se recibió un token de autenticación');
            }
            
            // Almacenar token JWT
            this.token = data.token;
            localStorage.setItem(ApiConfig.tokenKey, this.token);
            
            // Decodificar y almacenar datos del token
            const tokenData = this.parseJwt(this.token);
            this.userData = {
                id: tokenData.nameid || tokenData.sub,
                username: tokenData.unique_name || username,
                email: tokenData.email || '',
                role: tokenData.role || 'user',
                exp: tokenData.exp
            };
            
            // Almacenar datos del usuario y expiración del token
            localStorage.setItem(ApiConfig.userDataKey, JSON.stringify(this.userData));
            const expirationTime = tokenData.exp ? tokenData.exp * 1000 : (new Date().getTime() + ApiConfig.tokenExpiration);
            localStorage.setItem('token_expiration', expirationTime.toString());
            this.tokenExpiration = expirationTime;
            
            return {
                user: this.userData,
                token: this.token
            };
            
        } catch (error) {
            console.error('Error de login:', error);
            throw error;
        }
    }
    
    /**
     * Registra un nuevo usuario en el sistema
     * @param {Object} userData - Datos del usuario
     * @returns {Promise<Object>} - Datos del usuario creado
     */
    async register(userData) {
        try {
            // Primero crear el registro de persona
            const personResponse = await fetch(`${ApiConfig.baseUrl}${ApiConfig.endpoints.person}`, {
                method: 'POST',
                headers: ApiConfig.headers,
                body: JSON.stringify({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    documentNumber: userData.documentNumber,
                    documentType: userData.documentType || 'CC',
                    phone: userData.phone || '',
                    isActive: true
                })
            });
            
            if (!personResponse.ok) {
                const errorData = await personResponse.json();
                throw new Error(errorData.message || 'Error al crear el registro de persona');
            }
            
            const personData = await personResponse.json();
            const personId = personData.id;
            
            // Luego crear el usuario
            const userResponse = await fetch(`${ApiConfig.baseUrl}${ApiConfig.endpoints.user}`, {
                method: 'POST',
                headers: ApiConfig.headers,
                body: JSON.stringify({
                    username: userData.username,
                    email: userData.email,
                    password: userData.password,
                    personId: personId,
                    isActive: true
                })
            });
            
            if (!userResponse.ok) {
                const errorData = await userResponse.json();
                throw new Error(errorData.message || 'Error al crear el usuario');
            }
            
            // Registro exitoso, ahora hacer login automático
            return this.login(userData.username, userData.password);
            
        } catch (error) {
            console.error('Error de registro:', error);
            throw error;
        }
    }
    
    /**
     * Verifica si el token JWT actual es válido
     * @returns {Promise<boolean>} - True si el token es válido
     */
    async validateToken() {
        if (!this.token) {
            return false;
        }
        
        try {
            const response = await fetch(`${ApiConfig.baseUrl}${ApiConfig.endpoints.validateToken}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            
            return response.ok;
            
        } catch (error) {
            console.error('Error al validar token:', error);
            return false;
        }
    }
    
    /**
     * Cierra la sesión del usuario eliminando el token y los datos
     */
    logout() {
        localStorage.removeItem(ApiConfig.tokenKey);
        localStorage.removeItem(ApiConfig.userDataKey);
        localStorage.removeItem('token_expiration');
        this.token = null;
        this.userData = {};
        this.tokenExpiration = null;
    }
    
    /**
     * Verifica si el usuario está autenticado actualmente
     * @returns {boolean} - True si hay un token válido
     */
    isAuthenticated() {
        return !!this.token && this.tokenExpiration && new Date().getTime() < parseInt(this.tokenExpiration);
    }
    
    /**
     * Obtiene el token JWT actual
     * @returns {string|null} - Token JWT o null si no hay sesión
     */
    getToken() {
        return this.token;
    }
    
    /**
     * Obtiene los datos del usuario actual
     * @returns {Object} - Datos del usuario o objeto vacío si no hay sesión
     */
    getUserData() {
        return this.userData;
    }
    
    /**
     * Crea las cabeceras HTTP con el token de autorización
     * @returns {Object} - Cabeceras HTTP con token Bearer
     */
    getAuthHeaders() {
        return {
            ...ApiConfig.headers,
            'Authorization': `Bearer ${this.token}`
        };
    }
    
    /**
     * Decodifica un token JWT para obtener los datos
     * @param {string} token - Token JWT
     * @returns {Object} - Datos decodificados del token
     */
    parseJwt(token) {
        try {
            // Obtener la parte del payload del token (segunda parte)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error al decodificar token JWT:', error);
            return {};
        }
    }
    
    /**
     * Verifica si el usuario tiene un rol específico
     * @param {string|Array} requiredRoles - Rol o roles requeridos
     * @returns {boolean} - True si el usuario tiene el rol requerido
     */
    hasRole(requiredRoles) {
        if (!this.isAuthenticated() || !this.userData.role) {
            return false;
        }
        
        if (Array.isArray(requiredRoles)) {
            return requiredRoles.includes(this.userData.role);
        }
        
        return this.userData.role === requiredRoles;
    }
}

// Exportar instancia única del servicio de autenticación
const authService = new JwtAuthService();
export default authService;