const API_URL = 'https://localhost:7182/api/UserNotification';
const USER_API_URL = 'https://localhost:7182/api/User';

// Elementos DOM
const notificationTableBody = document.getElementById('notificationTableBody');
const statusMessage = document.getElementById('statusMessage');
const loadDataBtn = document.getElementById('loadDataBtn');
const testAPIBtn = document.getElementById('testAPIBtn');
const addNotificationBtn = document.getElementById('addNotificationBtn');
const saveNotificationBtn = document.getElementById('saveNotificationBtn');
const updateNotificationBtn = document.getElementById('updateNotificationBtn');
const saveMessageReadBtn = document.getElementById('saveMessageReadBtn');
const markAllReadBtn = document.getElementById('markAllReadBtn');
const saveViewStatusBtn = document.getElementById('saveViewStatusBtn');

// Referencias a modales para Bootstrap 5
let addNotificationModal;
let editNotificationModal;
let updateMessageReadModal;
let viewNotificationModal;

// Cache de datos
let users = [];

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

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Cargar usuarios para los selectores
function loadUsers() {
    return fetch(USER_API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al cargar usuarios: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            users = Array.isArray(data) ? data : [data];
            
            // Llenar los selectores de usuarios
            const userSelectors = [
                document.getElementById('userId'),
                document.getElementById('editUserId')
            ];
            
            userSelectors.forEach(selector => {
                if (!selector) return;
                
                // Mantener la opción predeterminada
                const defaultOption = selector.options[0];
                selector.innerHTML = '';
                selector.appendChild(defaultOption);
                
                // Añadir las opciones de usuarios
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = `${user.username} (${user.email})`;
                    selector.appendChild(option);
                });
            });
            
            return true;
        })
        .catch(error => {
            console.error('Error al cargar usuarios:', error);
            showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar usuarios: ${error.message}`, 'danger');
            return false;
        });
}

// Obtener nombre de usuario por ID
function getUsernameById(userId) {
    const user = users.find(u => u.id === userId);
    return user ? `${user.username} (${user.email})` : `Usuario ID: ${userId}`;
}

// Cargar notificaciones desde la API
function loadNotifications() {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando notificaciones...', 'info');
    
    // Primero cargar usuarios
    loadUsers()
        .then(() => {
            return fetch(API_URL)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error de servidor: ${response.status}`);
                    }
                    return response.json();
                });
        })
        .then(data => {
            console.log('Datos recibidos:', data);
            
            if (!data || (Array.isArray(data) && data.length === 0)) {
                notificationTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay notificaciones disponibles</td></tr>';
                showMessage('No hay notificaciones disponibles en el sistema', 'warning');
                return;
            }
            
            // Asegurarse de que data sea un array
            const notifications = Array.isArray(data) ? data : [data];
            
            // Construir la tabla
            let html = '';
            notifications.forEach(notification => {
                html += `
                    <tr class="notification-item ${notification.isRead ? 'notification-read' : 'notification-unread'}">
                        <td>${notification.id}</td>
                        <td>${getUsernameById(notification.userId)}</td>
                        <td class="message-cell" title="${notification.message}">${notification.message}</td>
                        <td>
                            <span class="badge read-badge ${notification.isRead ? 'read-true' : 'read-false'}">
                                ${notification.isRead ? 'Leída' : 'No leída'}
                            </span>
                        </td>
                        <td>
                            <span class="badge ${notification.isActive ? 'bg-success' : 'bg-secondary'}">
                                ${notification.isActive ? 'Activa' : 'Inactiva'}
                            </span>
                        </td>
                        <td>${formatDate(notification.createdAt)}</td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-info view-btn" data-id="${notification.id}" title="Ver Detalle">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-warning edit-btn" data-id="${notification.id}" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-primary update-message-btn" data-id="${notification.id}" title="Actualizar Mensaje">
                                    <i class="fas fa-comment-alt"></i>
                                </button>
                                <button class="btn btn-sm btn-danger delete-btn" data-id="${notification.id}" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button class="btn btn-sm ${notification.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                        data-id="${notification.id}" data-active="${notification.isActive}" title="${notification.isActive ? 'Desactivar' : 'Activar'}">
                                    <i class="fas fa-${notification.isActive ? 'times' : 'check'}"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            notificationTableBody.innerHTML = html;
            showMessage(`${notifications.length} notificaciones cargadas correctamente`, 'success');
            
            // Agregar event listeners a los botones
            addButtonEventListeners();
        })
        .catch(error => {
            console.error('Error cargando notificaciones:', error);
            notificationTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">
                <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
            </td></tr>`;
            showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar notificaciones: ${error.message}`, 'danger');
        });
}

// Añadir event listeners a los botones en la tabla
function addButtonEventListeners() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const notificationId = this.getAttribute('data-id');
            viewNotificationDetail(notificationId);
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const notificationId = this.getAttribute('data-id');
            getNotificationById(notificationId);
        });
    });
    
    document.querySelectorAll('.update-message-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const notificationId = this.getAttribute('data-id');
            getNotificationForMessageUpdate(notificationId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const notificationId = this.getAttribute('data-id');
            deleteNotification(notificationId);
        });
    });
    
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const notificationId = this.getAttribute('data-id');
            const currentStatus = this.getAttribute('data-active') === 'true';
            toggleNotificationStatus(notificationId, !currentStatus);
        });
    });
}

// Ver detalle de la notificación
function viewNotificationDetail(id) {
    fetch(`${API_URL}/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error de servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(notification => {
            // Llenar el modal con los detalles
            document.getElementById('viewNotificationId').textContent = notification.id;
            document.getElementById('viewNotificationUser').textContent = getUsernameById(notification.userId);
            document.getElementById('viewNotificationMessage').textContent = notification.message;
            document.getElementById('viewNotificationIsRead').textContent = notification.isRead ? 'Leída' : 'No leída';
            document.getElementById('viewNotificationIsActive').textContent = notification.isActive ? 'Activa' : 'Inactiva';
            document.getElementById('viewNotificationCreatedAt').textContent = formatDate(notification.createdAt);
            
            // Configurar el checkbox de lectura
            const checkboxRead = document.getElementById('viewMarkAsRead');
            checkboxRead.checked = notification.isRead;
            
            // Guardar el ID para la actualización
            checkboxRead.setAttribute('data-id', notification.id);
            
            viewNotificationModal.show();
        })
        .catch(error => {
            showMessage(`<i class="fas fa-times-circle"></i> Error al obtener detalles de la notificación: ${error.message}`, 'danger');
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

// Crear notificación
function createNotification(notificationData) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Creando notificación...', 'info');
    
    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showMessage('<i class="fas fa-check-circle"></i> Notificación enviada correctamente', 'success');
        loadNotifications(); // Recargar la tabla
        addNotificationModal.hide();
        document.getElementById('addNotificationForm').reset();
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al crear notificación: ${error.message}`, 'danger');
    });
}

// Eliminar notificación
function deleteNotification(id) {
    if (!confirm('¿Está seguro de eliminar esta notificación?')) return;
    
    showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando notificación...', 'info');
    
    fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showMessage('<i class="fas fa-check-circle"></i> Notificación eliminada correctamente', 'success');
        loadNotifications(); // Recargar la tabla
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar notificación: ${error.message}`, 'danger');
    });
}

// Cambiar estado de notificación
function toggleNotificationStatus(id, newStatus) {
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
        loadNotifications(); // Recargar la tabla
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
    });
}

// Obtener notificación por ID
function getNotificationById(id) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos de la notificación...', 'info');
    
    fetch(`${API_URL}/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error de servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(notification => {
            // Llenar formulario
            document.getElementById('editNotificationId').value = notification.id;
            document.getElementById('editUserId').value = notification.userId;
            document.getElementById('editMessage').value = notification.message;
            document.getElementById('editIsRead').checked = notification.isRead;
            document.getElementById('editIsActive').checked = notification.isActive;
            document.getElementById('editCreatedAt').value = formatDate(notification.createdAt);
            
            editNotificationModal.show();
            statusMessage.style.display = 'none';
        })
        .catch(error => {
            showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos de la notificación: ${error.message}`, 'danger');
        });
}

// Obtener notificación para actualizar mensaje y estado de lectura
function getNotificationForMessageUpdate(id) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos de la notificación...', 'info');
    
    fetch(`${API_URL}/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error de servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(notification => {
            // Llenar formulario
            document.getElementById('messageReadId').value = notification.id;
            document.getElementById('messageReadUserLabel').textContent = `Usuario: ${getUsernameById(notification.userId)}`;
            document.getElementById('messageReadText').value = notification.message;
            document.getElementById('messageIsRead').checked = notification.isRead;
            
            updateMessageReadModal.show();
            statusMessage.style.display = 'none';
        })
        .catch(error => {
            showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos de la notificación: ${error.message}`, 'danger');
        });
}

// Actualizar notificación
function updateNotification(id, notificationData) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando notificación...', 'info');
    
    fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showMessage('<i class="fas fa-check-circle"></i> Notificación actualizada correctamente', 'success');
        loadNotifications(); // Recargar la tabla
        editNotificationModal.hide();
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar notificación: ${error.message}`, 'danger');
    });
}

// Actualizar mensaje y estado de lectura
function updateMessageAndRead(id, message, isRead) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando mensaje y estado de lectura...', 'info');
    
    const notificationData = {
        id: parseInt(id),
        message: message,
        isRead: isRead
    };
    
    fetch(`${API_URL}/${id}/message-read`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showMessage('<i class="fas fa-check-circle"></i> Mensaje y estado de lectura actualizados correctamente', 'success');
        loadNotifications(); // Recargar la tabla
        updateMessageReadModal.hide();
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar mensaje y estado de lectura: ${error.message}`, 'danger');
    });
}

// Marcar todas como leídas (simulación)
function markAllAsRead() {
    if (!confirm('¿Está seguro de marcar todas las notificaciones como leídas?')) return;
    
    showMessage('<i class="fas fa-spinner fa-spin"></i> Marcando todas las notificaciones como leídas...', 'info');
    
    // En un escenario real, tendríamos un endpoint específico para esto
    // Para simular, buscaremos todas las notificaciones no leídas y las actualizaremos una por una
    
    // Esta es una solución simulada - en producción debería haber un endpoint específico
    let promises = [];
    document.querySelectorAll('.notification-unread').forEach(row => {
        const idCell = row.cells[0].textContent;
        if (idCell) {
            const id = parseInt(idCell);
            
            // Obtenemos el mensaje actual
            const messageCell = row.cells[2].textContent;
            
            // Creamos la promesa para actualizar
            const promise = fetch(`${API_URL}/${id}/message-read`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: id,
                    message: messageCell,
                    isRead: true
                })
            });
            
            promises.push(promise);
        }
    });
    
    // Esperar a que todas las actualizaciones se completen
    Promise.allSettled(promises)
        .then(() => {
            showMessage('<i class="fas fa-check-circle"></i> Todas las notificaciones han sido marcadas como leídas', 'success');
            loadNotifications(); // Recargar la tabla
        })
        .catch(error => {
            showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al marcar las notificaciones como leídas: ${error.message}`, 'danger');
        });
}

// Guardar estado de lectura desde la vista detalle
function saveReadStatusFromView() {
    const checkbox = document.getElementById('viewMarkAsRead');
    const id = checkbox.getAttribute('data-id');
    const isRead = checkbox.checked;
    
    // Obtener el mensaje actual
    const message = document.getElementById('viewNotificationMessage').textContent;
    
    // Actualizar estado de lectura
    updateMessageAndRead(id, message, isRead)
        .then(() => {
            viewNotificationModal.hide();
        });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar modales de Bootstrap 5
    addNotificationModal = new bootstrap.Modal(document.getElementById('addNotificationModal'));
    editNotificationModal = new bootstrap.Modal(document.getElementById('editNotificationModal'));
    updateMessageReadModal = new bootstrap.Modal(document.getElementById('updateMessageReadModal'));
    viewNotificationModal = new bootstrap.Modal(document.getElementById('viewNotificationModal'));
    
    // Cargar datos al iniciar
    loadNotifications();
    
    // Event listeners para botones
    loadDataBtn.addEventListener('click', loadNotifications);
    testAPIBtn.addEventListener('click', testAPI);
    markAllReadBtn.addEventListener('click', markAllAsRead);
    
    addNotificationBtn.addEventListener('click', function() {
        loadUsers().then(() => {
            document.getElementById('addNotificationForm').reset();
            // Establecer valores predeterminados
            document.getElementById('isActive').checked = true;
            addNotificationModal.show();
        });
    });
    
    saveNotificationBtn.addEventListener('click', function() {
        const notificationData = {
            userId: parseInt(document.getElementById('userId').value),
            message: document.getElementById('message').value,
            isRead: false, // Por defecto las nuevas notificaciones no están leídas
            isActive: document.getElementById('isActive').checked
        };
        
        // Validaciones
        if (!notificationData.userId) {
            showMessage('Por favor, seleccione un usuario', 'warning');
            return;
        }
        if (!notificationData.message) {
            showMessage('Por favor, ingrese un mensaje', 'warning');
            return;
        }
        
        createNotification(notificationData);
    });
    
    updateNotificationBtn.addEventListener('click', function() {
        const id = document.getElementById('editNotificationId').value;
        const notificationData = {
            id: parseInt(id),
            userId: parseInt(document.getElementById('editUserId').value),
            message: document.getElementById('editMessage').value,
            isRead: document.getElementById('editIsRead').checked,
            isActive: document.getElementById('editIsActive').checked
        };
        
        // Validaciones
        if (!notificationData.userId) {
            showMessage('Por favor, seleccione un usuario', 'warning');
            return;
        }
        if (!notificationData.message) {
            showMessage('Por favor, ingrese un mensaje', 'warning');
            return;
        }
        
        updateNotification(id, notificationData);
    });
    
    saveMessageReadBtn.addEventListener('click', function() {
        const id = document.getElementById('messageReadId').value;
        const message = document.getElementById('messageReadText').value;
        const isRead = document.getElementById('messageIsRead').checked;
        
        // Validaciones
        if (!message) {
            showMessage('Por favor, ingrese un mensaje', 'warning');
            return;
        }
        
        updateMessageAndRead(id, message, isRead);
    });
    
    saveViewStatusBtn.addEventListener('click', saveReadStatusFromView);
});
/* JAVASCRIPT PARA LA BARRA DE NAVEGACIÓN */
// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
// Si prefieres inicializar los dropdowns manualmente (generalmente no es necesario con Bootstrap 5)
const dropdowns = document.querySelectorAll('.dropdown-toggle');

// Hacer que los elementos del menú desplegable cierren el menú al hacer clic
const dropdownItems = document.querySelectorAll('.dropdown-item');
dropdownItems.forEach(item => {
item.addEventListener('click', function() {
    // Solo cerrar el menú en dispositivos móviles cuando se hace clic en un elemento
    if (window.innerWidth < 992) {
        const navbarCollapse = document.querySelector('.navbar-collapse');
        if (navbarCollapse.classList.contains('show')) {
            bootstrap.Collapse.getInstance(navbarCollapse).hide();
        }
    }
});
});

// Opcional: Cerrar otros dropdowns cuando se abre uno nuevo (solo en escritorio)
const dropdownMenus = document.querySelectorAll('.dropdown');
dropdownMenus.forEach(dropdown => {
dropdown.addEventListener('show.bs.dropdown', function() {
    if (window.innerWidth >= 992) {
        dropdownMenus.forEach(otherDropdown => {
            if (otherDropdown !== dropdown) {
                const bsDropdown = bootstrap.Dropdown.getInstance(otherDropdown.querySelector('.dropdown-toggle'));
                if (bsDropdown) {
                    bsDropdown.hide();
                }
            }
        });
    }
});
});

// Hacer que los menús desplegables se muestren al pasar el ratón por encima (solo en escritorio)
if (window.innerWidth >= 992) {
dropdownMenus.forEach(dropdown => {
    dropdown.addEventListener('mouseenter', function() {
        const dropdownToggle = this.querySelector('.dropdown-toggle');
        const bsDropdown = bootstrap.Dropdown.getOrCreateInstance(dropdownToggle);
        bsDropdown.show();
    });
    
    dropdown.addEventListener('mouseleave', function() {
        const dropdownToggle = this.querySelector('.dropdown-toggle');
        const bsDropdown = bootstrap.Dropdown.getInstance(dropdownToggle);
        if (bsDropdown) {
            bsDropdown.hide();
        }
    });
});
}

// Actualizar el estado activo del menú basado en la URL actual
function updateActiveMenu() {
const currentPage = window.location.pathname.split('/').pop();

document.querySelectorAll('.nav-link, .dropdown-item').forEach(link => {
    const href = link.getAttribute('href');
    
    if (href && href !== '#') {
        // Remover la clase active de todos los enlaces
        link.classList.remove('active');
        
        // Si el href coincide con la página actual, agregar la clase active
        if (href === currentPage) {
            link.classList.add('active');
            
            // Si el elemento está dentro de un dropdown, también activar el dropdown
            const parentDropdown = link.closest('.dropdown');
            if (parentDropdown) {
                const dropdownToggle = parentDropdown.querySelector('.dropdown-toggle');
                if (dropdownToggle) {
                    dropdownToggle.classList.add('active');
                }
            }
        }
    }
});
}

// Ejecutar al cargar la página
updateActiveMenu();
});