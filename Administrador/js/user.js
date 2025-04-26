// Configuración API
const API_URL = 'https://localhost:7182/api/User';
        
// Elementos DOM
const userTableBody = document.getElementById('userTableBody');
const statusMessage = document.getElementById('statusMessage');
const personNotification = document.getElementById('personNotification');
const personNotificationText = document.getElementById('personNotificationText');
const loadDataBtn = document.getElementById('loadDataBtn');
const testAPIBtn = document.getElementById('testAPIBtn');
const addUserBtn = document.getElementById('addUserBtn');
const saveUserBtn = document.getElementById('saveUserBtn');
const updateUserBtn = document.getElementById('updateUserBtn');
const saveCredentialsBtn = document.getElementById('saveCredentialsBtn');

// Referencias a modales para Bootstrap 5
let addUserModal;
let editUserModal;
let credentialsModal;

// Mostrar mensaje de estado
function showMessage(message, type = 'info') {
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

// Cargar usuarios desde la API
function loadUsers() {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando usuarios...', 'info');
    
    fetch(API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error de servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos:', data);
            
            if (!data || (Array.isArray(data) && data.length === 0)) {
                userTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay usuarios disponibles</td></tr>';
                showMessage('No hay usuarios disponibles en el sistema', 'warning');
                return;
            }
            
            // Asegurarse de que data sea un array
            const users = Array.isArray(data) ? data : [data];
            
            // Construir la tabla
            let html = '';
            users.forEach(user => {
                html += `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${user.personId || 'No asignado'}</td>
                        <td>
                            <span class="badge ${user.isActive ? 'bg-success' : 'bg-secondary'}">
                                ${user.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-warning edit-btn" data-id="${user.id}" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-info credentials-btn" data-id="${user.id}" title="Actualizar credenciales">
                                    <i class="fas fa-key"></i>
                                </button>
                                <button class="btn btn-sm btn-danger delete-btn" data-id="${user.id}" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button class="btn btn-sm ${user.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                        data-id="${user.id}" data-active="${user.isActive}" title="${user.isActive ? 'Desactivar' : 'Activar'}">
                                    <i class="fas fa-${user.isActive ? 'times' : 'check'}"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            userTableBody.innerHTML = html;
            showMessage(`${users.length} usuarios cargados correctamente`, 'success');
            
            // Agregar event listeners a los botones
            addButtonEventListeners();
        })
        .catch(error => {
            console.error('Error cargando usuarios:', error);
            userTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">
                <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
            </td></tr>`;
            showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar usuarios: ${error.message}`, 'danger');
        });
}

// Añadir event listeners a los botones en la tabla
function addButtonEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            getUserById(userId);
        });
    });
    
    document.querySelectorAll('.credentials-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            getCredentials(userId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            deleteUser(userId);
        });
    });
    
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            const currentStatus = this.getAttribute('data-active') === 'true';
            toggleUserStatus(userId, !currentStatus);
        });
    });
}

// Probar conexión API
function testAPI() {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Probando conexión a la API...', 'info');
    
    fetch(API_URL, { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                showMessage('<i class="fas fa-check-circle"></i> API accesible', 'success');
            } else {
                showMessage(`<i class="fas fa-exclamation-circle"></i> API respondió con estado: ${response.status}`, 'warning');
            }
        })
        .catch(error => {
            showMessage(`<i class="fas fa-times-circle"></i> No se puede acceder a la API: ${error.message}`, 'danger');
        });
}

// Verificar parámetros en la URL para registro desde Personas
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const personId = urlParams.get('personId');
    const personName = urlParams.get('personName');
    const register = urlParams.get('register');
    
    if (personId && register === 'true') {
        // Mostrar notificación
        personNotificationText.textContent = `Persona seleccionada: ${personName || 'ID: ' + personId}`;
        personNotification.style.display = 'block';
        
        // Establecer el ID de la persona en el campo oculto
        document.getElementById('personId').value = personId;
        
        // Abrir el modal de agregar usuario
        setTimeout(() => {
            addUserModal.show();
        }, 500);
        
        // Limpiar los parámetros de la URL para evitar abrir el modal al refrescar
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Crear usuario
function createUser(userData) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Creando usuario...', 'info');
    
    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showMessage('<i class="fas fa-check-circle"></i> Usuario creado correctamente', 'success');
        loadUsers(); // Recargar la tabla
        addUserModal.hide();
        document.getElementById('addUserForm').reset();
        
        // Ocultar la notificación de persona
        personNotification.style.display = 'none';
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al crear usuario: ${error.message}`, 'danger');
    });
}

// Eliminar usuario
function deleteUser(id) {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;
    
    showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando usuario...', 'info');
    
    fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        showMessage('<i class="fas fa-check-circle"></i> Usuario eliminado correctamente', 'success');
        loadUsers(); // Recargar la tabla
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar usuario: ${error.message}`, 'danger');
    });
}

// Cambiar estado de usuario
function toggleUserStatus(id, newStatus) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando estado...', 'info');
    
    fetch(`${API_URL}/${id}/active`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStatus)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showMessage('<i class="fas fa-check-circle"></i> Estado actualizado correctamente', 'success');
        loadUsers(); // Recargar la tabla
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
    });
}

// Obtener usuario por ID
function getUserById(id) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del usuario...', 'info');
    
    fetch(`${API_URL}/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error de servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(user => {
            // Llenar formulario
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editUsername').value = user.username;
            document.getElementById('editEmail').value = user.email;
            document.getElementById('editPassword').value = '';
            document.getElementById('editPersonId').value = user.personId || 0;
            document.getElementById('editIsActive').checked = user.isActive;
            
            editUserModal.show();
            statusMessage.style.display = 'none';
        })
        .catch(error => {
            showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del usuario: ${error.message}`, 'danger');
        });
}

// Obtener credenciales para actualizar
function getCredentials(id) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando credenciales...', 'info');
    
    fetch(`${API_URL}/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error de servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(user => {
            // Llenar formulario
            document.getElementById('credentialsUserId').value = user.id;
            document.getElementById('credentialsUsername').value = user.username;
            document.getElementById('credentialsEmail').value = user.email;
            document.getElementById('credentialsPassword').value = '';
            
            credentialsModal.show();
            statusMessage.style.display = 'none';
        })
        .catch(error => {
            showMessage(`<i class="fas fa-times-circle"></i> Error al obtener credenciales: ${error.message}`, 'danger');
        });
}

// Actualizar usuario
function updateUser(id, userData) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando usuario...', 'info');
    
    // Si la contraseña está vacía, eliminarla del objeto para no actualizarla
    if (!userData.password) {
        delete userData.password;
    }
    
    fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showMessage('<i class="fas fa-check-circle"></i> Usuario actualizado correctamente', 'success');
        loadUsers(); // Recargar la tabla
        editUserModal.hide();
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar usuario: ${error.message}`, 'danger');
    });
}

// Actualizar solo credenciales (usando el endpoint especial)
function updateCredentials(id, credentialsData) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando credenciales...', 'info');
    
    fetch(`${API_URL}/${id}/Username-Email-password`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentialsData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showMessage('<i class="fas fa-check-circle"></i> Credenciales actualizadas correctamente', 'success');
        loadUsers(); // Recargar la tabla
        credentialsModal.hide();
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar credenciales: ${error.message}`, 'danger');
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar modales de Bootstrap 5
    addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'));
    editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
    credentialsModal = new bootstrap.Modal(document.getElementById('credentialsModal'));
    
    // Cargar datos al iniciar
    loadUsers();
    
    // Verificar parámetros en la URL
    checkUrlParameters();
    
    // Event listeners para botones
    loadDataBtn.addEventListener('click', loadUsers);
    testAPIBtn.addEventListener('click', testAPI);
    
    addUserBtn.addEventListener('click', function() {
        document.getElementById('addUserForm').reset();
        document.getElementById('personId').value = 0; // Establecer personId por defecto
        addUserModal.show();
    });
    
    saveUserBtn.addEventListener('click', function() {
        const userData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            personId: parseInt(document.getElementById('personId').value) || 0,
            isActive: document.getElementById('isActive').checked
        };
        createUser(userData);
    });
    
    updateUserBtn.addEventListener('click', function() {
        const id = document.getElementById('editUserId').value;
        const userData = {
            id: parseInt(id),
            username: document.getElementById('editUsername').value,
            email: document.getElementById('editEmail').value,
            password: document.getElementById('editPassword').value,
            personId: parseInt(document.getElementById('editPersonId').value) || 0,
            isActive: document.getElementById('editIsActive').checked
        };
        updateUser(id, userData);
    });
    
    saveCredentialsBtn.addEventListener('click', function() {
        const id = document.getElementById('credentialsUserId').value;
        const credentialsData = {
            id: parseInt(id),
            username: document.getElementById('credentialsUsername').value,
            email: document.getElementById('credentialsEmail').value,
            password: document.getElementById('credentialsPassword').value
        };
        
        // Si la contraseña está vacía, eliminarla del objeto para no actualizarla
        if (!credentialsData.password) {
            delete credentialsData.password;
        }
        
        updateCredentials(id, credentialsData);
    });
});