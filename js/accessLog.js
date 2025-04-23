 // Configuración API
 const API_URL = 'https://localhost:7182/api/AccessLog';
 const USER_API_URL = 'https://localhost:7182/api/User';
 
 // Elementos DOM
 const accessLogTableBody = document.getElementById('accessLogTableBody');
 const statusMessage = document.getElementById('statusMessage');
 const loadDataBtn = document.getElementById('loadDataBtn');
 const testAPIBtn = document.getElementById('testAPIBtn');
 const addAccessLogBtn = document.getElementById('addAccessLogBtn');
 const applyFilterBtn = document.getElementById('applyFilterBtn');
 const saveAccessLogBtn = document.getElementById('saveAccessLogBtn');
 const updateAccessLogBtn = document.getElementById('updateAccessLogBtn');
 const saveFieldsBtn = document.getElementById('saveFieldsBtn');
 
 // Referencias a modales para Bootstrap 5
 let addAccessLogModal;
 let editAccessLogModal;
 let updateFieldsModal;
 let viewDetailsModal;
 
 // Cache de datos
 let usersList = [];
 
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
 
 // Obtener clase para el badge de acción según el valor
 function getActionBadgeClass(action) {
     if (!action) return '';
     
     switch(action.toUpperCase()) {
         case 'LOGIN':
             return 'action-login';
         case 'LOGOUT':
             return 'action-logout';
         case 'VIEW':
             return 'action-view';
         case 'CREATE':
             return 'action-create';
         case 'UPDATE':
             return 'action-update';
         case 'DELETE':
             return 'action-delete';
         default:
             return '';
     }
 }
 
 // Formatear fecha y hora
 function formatDateTime(dateTimeString) {
     if (!dateTimeString) return 'N/A';
     const date = new Date(dateTimeString);
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
             usersList = Array.isArray(data) ? data : [data];
             
             // Llenar los selectores de usuarios
             const selectors = ['userId', 'editUserId', 'filterUser'];
             selectors.forEach(id => {
                 const selector = document.getElementById(id);
                 if (selector) {
                     // Mantener la opción predeterminada
                     const defaultOption = selector.options[0];
                     selector.innerHTML = '';
                     selector.appendChild(defaultOption);
                     
                     // Añadir las opciones de usuarios
                     usersList.forEach(user => {
                         const option = document.createElement('option');
                         option.value = user.id;
                         option.textContent = `${user.username} (${user.email})`;
                         selector.appendChild(option);
                     });
                 }
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
     const user = usersList.find(u => u.id === userId);
     return user ? `${user.username} (${user.email})` : `Usuario ID: ${userId}`;
 }
 
 // Aplicar filtros a la consulta
 function applyFilters() {
     const userId = document.getElementById('filterUser').value;
     const action = document.getElementById('filterAction').value;
     const status = document.getElementById('filterStatus').value;
     const isActive = document.getElementById('filterActive').value;
     const dateFrom = document.getElementById('filterDateFrom').value;
     const dateTo = document.getElementById('filterDateTo').value;
     
     // Construir URL con parámetros de filtro
     let url = API_URL;
     const params = new URLSearchParams();
     
     if (userId) params.append('userId', userId);
     if (action) params.append('action', action);
     if (status) params.append('status', status);
     if (isActive) params.append('isActive', isActive);
     if (dateFrom) params.append('dateFrom', dateFrom);
     if (dateTo) params.append('dateTo', dateTo);
     
     if (params.toString()) {
         url += '?' + params.toString();
     }
     
     // Cargar datos filtrados
     loadAccessLogs(url);
 }
 
 // Cargar registros de acceso desde la API
 function loadAccessLogs(url = API_URL) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando registros de acceso...', 'info');
     
     // Primero cargar los usuarios para tener referencias
     loadUsers().then(() => {
         fetch(url)
             .then(response => {
                 if (!response.ok) {
                     throw new Error(`Error de servidor: ${response.status}`);
                 }
                 return response.json();
             })
             .then(data => {
                 console.log('Datos recibidos:', data);
                 
                 if (!data || (Array.isArray(data) && data.length === 0)) {
                     accessLogTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No hay registros de acceso disponibles</td></tr>';
                     showMessage('No hay registros de acceso disponibles en el sistema', 'warning');
                     return;
                 }
                 
                 // Asegurarse de que data sea un array
                 const logs = Array.isArray(data) ? data : [data];
                 
                 // Construir la tabla
                 let html = '';
                 logs.forEach(log => {
                     html += `
                         <tr>
                             <td>${log.id}</td>
                             <td>${getUsernameById(log.userId)}</td>
                             <td>
                                 <span class="badge action-badge ${getActionBadgeClass(log.action)}">
                                     ${log.action || 'N/A'}
                                 </span>
                             </td>
                             <td class="timestamp">${formatDateTime(log.timestamp)}</td>
                             <td>
                                 <span class="badge ${log.status ? 'bg-success' : 'bg-danger'}">
                                     ${log.status ? 'Exitoso' : 'Fallido'}
                                 </span>
                             </td>
                             <td class="details-cell" title="${log.details || ''}">${log.details || 'Sin detalles'}</td>
                             <td>
                                 <span class="badge ${log.isActive ? 'bg-success' : 'bg-secondary'}">
                                     ${log.isActive ? 'Activo' : 'Inactivo'}
                                 </span>
                             </td>
                             <td>
                                 <div class="btn-group" role="group">
                                     <button class="btn btn-sm btn-info view-btn" data-id="${log.id}" title="Ver Detalles">
                                         <i class="fas fa-eye"></i>
                                     </button>
                                     <button class="btn btn-sm btn-warning edit-btn" data-id="${log.id}" title="Editar">
                                         <i class="fas fa-edit"></i>
                                     </button>
                                     <button class="btn btn-sm btn-primary update-fields-btn" data-id="${log.id}" title="Actualizar Campos">
                                         <i class="fas fa-sliders-h"></i>
                                     </button>
                                     <button class="btn btn-sm btn-danger delete-btn" data-id="${log.id}" title="Eliminar">
                                         <i class="fas fa-trash"></i>
                                     </button>
                                     <button class="btn btn-sm ${log.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                             data-id="${log.id}" data-active="${log.isActive}" title="${log.isActive ? 'Desactivar' : 'Activar'}">
                                         <i class="fas fa-${log.isActive ? 'times' : 'check'}"></i>
                                     </button>
                                 </div>
                             </td>
                         </tr>
                     `;
                 });
                 
                 accessLogTableBody.innerHTML = html;
                 showMessage(`${logs.length} registros de acceso cargados correctamente`, 'success');
                 
                 // Agregar event listeners a los botones
                 addButtonEventListeners();
             })
             .catch(error => {
                 console.error('Error cargando registros de acceso:', error);
                 accessLogTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">
                     <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
                 </td></tr>`;
                 showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar registros de acceso: ${error.message}`, 'danger');
             });
     });
 }
 
 // Añadir event listeners a los botones en la tabla
 function addButtonEventListeners() {
     document.querySelectorAll('.view-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const logId = this.getAttribute('data-id');
             viewAccessLogDetails(logId);
         });
     });
     
     document.querySelectorAll('.edit-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const logId = this.getAttribute('data-id');
             getAccessLogById(logId);
         });
     });
     
     document.querySelectorAll('.update-fields-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const logId = this.getAttribute('data-id');
             getAccessLogForFieldsUpdate(logId);
         });
     });
     
     document.querySelectorAll('.delete-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const logId = this.getAttribute('data-id');
             deleteAccessLog(logId);
         });
     });
     
     document.querySelectorAll('.toggle-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const logId = this.getAttribute('data-id');
             const currentStatus = this.getAttribute('data-active') === 'true';
             toggleAccessLogStatus(logId, !currentStatus);
         });
     });
 }
 
 // Ver detalles completos de un registro
 function viewAccessLogDetails(id) {
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(log => {
             // Llenar el modal de detalles
             document.getElementById('detailId').textContent = log.id;
             document.getElementById('detailUser').textContent = getUsernameById(log.userId);
             document.getElementById('detailAction').textContent = log.action;
             document.getElementById('detailTimestamp').textContent = formatDateTime(log.timestamp);
             document.getElementById('detailStatus').textContent = log.status ? 'Exitoso' : 'Fallido';
             document.getElementById('detailActive').textContent = log.isActive ? 'Activo' : 'Inactivo';
             document.getElementById('detailDetails').textContent = log.details || 'Sin detalles';
             document.getElementById('detailCreatedAt').textContent = formatDateTime(log.createdAt);
             
             // Mostrar el modal
             viewDetailsModal.show();
         })
         .catch(error => {
             console.error('Error al cargar detalles:', error);
             showMessage(`<i class="fas fa-times-circle"></i> Error al cargar detalles: ${error.message}`, 'danger');
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
 
 // Crear registro de acceso
 function createAccessLog(logData) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Creando registro de acceso...', 'info');
     
     fetch(API_URL, {
         method: 'POST',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(logData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Registro de acceso creado correctamente', 'success');
         loadAccessLogs(); // Recargar la tabla
         addAccessLogModal.hide();
         document.getElementById('addAccessLogForm').reset();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al crear registro de acceso: ${error.message}`, 'danger');
     });
 }
 
 // Eliminar registro de acceso
 function deleteAccessLog(id) {
     if (!confirm('¿Está seguro de eliminar este registro de acceso?')) return;
     
     showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando registro de acceso...', 'info');
     
     fetch(`${API_URL}/${id}`, {
         method: 'DELETE'
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         showMessage('<i class="fas fa-check-circle"></i> Registro de acceso eliminado correctamente', 'success');
         loadAccessLogs(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar registro de acceso: ${error.message}`, 'danger');
     });
 }
 
 // Cambiar estado de registro de acceso
 function toggleAccessLogStatus(id, newStatus) {
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
         loadAccessLogs(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
     });
 }
 
 // Obtener registro de acceso por ID
 function getAccessLogById(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del registro de acceso...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(log => {
             // Llenar formulario
             document.getElementById('editAccessLogId').value = log.id;
             document.getElementById('editUserId').value = log.userId;
             document.getElementById('editAction').value = log.action;
             
             // Formatear la fecha y hora para el input datetime-local
             const timestamp = new Date(log.timestamp);
             const formattedTimestamp = timestamp.toISOString().slice(0, 16);
             document.getElementById('editTimestamp').value = formattedTimestamp;
             
             document.getElementById('editStatus').checked = log.status;
             document.getElementById('editDetails').value = log.details || '';
             document.getElementById('editIsActive').checked = log.isActive;
             
             // Formatear la fecha de creación para el input datetime-local
             const createdAt = new Date(log.createdAt);
             const formattedCreatedAt = createdAt.toISOString().slice(0, 16);
             document.getElementById('editCreatedAt').value = formattedCreatedAt;
             
             editAccessLogModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del registro de acceso: ${error.message}`, 'danger');
         });
 }
 
 // Obtener registro para actualización de campos específicos
 function getAccessLogForFieldsUpdate(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del registro...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(log => {
             // Llenar formulario
             document.getElementById('fieldsAccessLogId').value = log.id;
             document.getElementById('fieldsAction').value = log.action;
             document.getElementById('fieldsStatus').checked = log.status;
             document.getElementById('fieldsDetails').value = log.details || '';
             
             updateFieldsModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del registro: ${error.message}`, 'danger');
         });
 }
 
 // Actualizar registro de acceso
 function updateAccessLog(id, logData) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando registro de acceso...', 'info');
     
     fetch(`${API_URL}/${id}`, {
         method: 'PUT',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(logData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         showMessage('<i class="fas fa-check-circle"></i> Registro de acceso actualizado correctamente', 'success');
         loadAccessLogs(); // Recargar la tabla
         editAccessLogModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar registro de acceso: ${error.message}`, 'danger');
     });
 }
 
 // Actualizar campos específicos del registro
 function updateAccessLogFields(id, action, status, details) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando campos específicos...', 'info');
     
     const logData = {
         id: parseInt(id),
         action: action,
         status: status,
         details: details
     };
     
     fetch(`${API_URL}/${id}/Update-Action-Status-Details`, {
         method: 'PATCH',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(logData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Campos actualizados correctamente', 'success');
         loadAccessLogs(); // Recargar la tabla
         updateFieldsModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar campos: ${error.message}`, 'danger');
     });
 }
 
 // Event listeners
 document.addEventListener('DOMContentLoaded', function() {
     // Inicializar modales de Bootstrap 5
     addAccessLogModal = new bootstrap.Modal(document.getElementById('addAccessLogModal'));
     editAccessLogModal = new bootstrap.Modal(document.getElementById('editAccessLogModal'));
     updateFieldsModal = new bootstrap.Modal(document.getElementById('updateFieldsModal'));
     viewDetailsModal = new bootstrap.Modal(document.getElementById('viewDetailsModal'));
     
     // Cargar datos al iniciar
     loadAccessLogs();
     
     // Event listeners para botones
     loadDataBtn.addEventListener('click', loadAccessLogs);
     testAPIBtn.addEventListener('click', testAPI);
     applyFilterBtn.addEventListener('click', applyFilters);
     
     addAccessLogBtn.addEventListener('click', function() {
         loadUsers().then(() => {
             document.getElementById('addAccessLogForm').reset();
             
             // Establecer la fecha y hora actual
             const now = new Date();
             const localDatetime = now.toISOString().slice(0, 16);
             document.getElementById('timestamp').value = localDatetime;
             
             addAccessLogModal.show();
         });
     });
     
     saveAccessLogBtn.addEventListener('click', function() {
         const logData = {
             userId: parseInt(document.getElementById('userId').value),
             action: document.getElementById('action').value,
             timestamp: new Date(document.getElementById('timestamp').value).toISOString(),
             status: document.getElementById('status').checked,
             details: document.getElementById('details').value || null,
             isActive: document.getElementById('isActive').checked
         };
         
         // Validaciones
         if (!logData.userId) {
             showMessage('Por favor, seleccione un usuario', 'warning');
             return;
         }
         if (!logData.action) {
             showMessage('Por favor, seleccione una acción', 'warning');
             return;
         }
         
         createAccessLog(logData);
     });
     
     updateAccessLogBtn.addEventListener('click', function() {
         const id = document.getElementById('editAccessLogId').value;
         const logData = {
             id: parseInt(id),
             userId: parseInt(document.getElementById('editUserId').value),
             action: document.getElementById('editAction').value,
             timestamp: new Date(document.getElementById('editTimestamp').value).toISOString(),
             status: document.getElementById('editStatus').checked,
             details: document.getElementById('editDetails').value || null,
             isActive: document.getElementById('editIsActive').checked
         };
         
         // Validaciones
         if (!logData.action) {
             showMessage('Por favor, seleccione una acción', 'warning');
             return;
         }
         
         updateAccessLog(id, logData);
     });
     
     saveFieldsBtn.addEventListener('click', function() {
         const id = document.getElementById('fieldsAccessLogId').value;
         const action = document.getElementById('fieldsAction').value;
         const status = document.getElementById('fieldsStatus').checked;
         const details = document.getElementById('fieldsDetails').value || null;
         
         // Validaciones
         if (!action) {
             showMessage('Por favor, seleccione una acción', 'warning');
             return;
         }
         
         updateAccessLogFields(id, action, status, details);
     });
     
     // Establecer fecha actual para los filtros de fecha
     const today = new Date().toISOString().split('T')[0];
     document.getElementById('filterDateTo').value = today;
     
     // Fecha hace 30 días para el filtro desde
     const thirtyDaysAgo = new Date();
     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
     document.getElementById('filterDateFrom').value = thirtyDaysAgo.toISOString().split('T')[0];
 });