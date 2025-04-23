 // Configuración API
 const API_URL = 'https://localhost:7182/api/Permission';
        
 // Elementos DOM
 const permissionTableBody = document.getElementById('permissionTableBody');
 const statusMessage = document.getElementById('statusMessage');
 const loadDataBtn = document.getElementById('loadDataBtn');
 const testAPIBtn = document.getElementById('testAPIBtn');
 const addPermissionBtn = document.getElementById('addPermissionBtn');
 const savePermissionBtn = document.getElementById('savePermissionBtn');
 const updatePermissionBtn = document.getElementById('updatePermissionBtn');
 const saveNameDescBtn = document.getElementById('saveNameDescBtn');
 
 // Referencias a modales para Bootstrap 5
 let addPermissionModal;
 let editPermissionModal;
 let updateNameDescModal;
 
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
 
 // Cargar permisos desde la API
 function loadPermissions() {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando permisos...', 'info');
     
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
                 permissionTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay permisos disponibles</td></tr>';
                 showMessage('No hay permisos disponibles en el sistema', 'warning');
                 return;
             }
             
             // Asegurarse de que data sea un array
             const permissions = Array.isArray(data) ? data : [data];
             
             // Construir la tabla
             let html = '';
             permissions.forEach(permission => {
                 html += `
                     <tr>
                         <td>${permission.id}</td>
                         <td>${permission.name}</td>
                         <td class="description-cell" title="${permission.description || ''}">${permission.description || 'Sin descripción'}</td>
                         <td>${formatDate(permission.createdAt)}</td>
                         <td>
                             <span class="badge ${permission.isActive ? 'bg-success' : 'bg-secondary'}">
                                 ${permission.isActive ? 'Activo' : 'Inactivo'}
                             </span>
                         </td>
                         <td>
                             <div class="btn-group" role="group">
                                 <button class="btn btn-sm btn-warning edit-btn" data-id="${permission.id}" title="Editar">
                                     <i class="fas fa-edit"></i>
                                 </button>
                                 <button class="btn btn-sm btn-info update-name-desc-btn" data-id="${permission.id}" title="Actualizar Nombre/Descripción">
                                     <i class="fas fa-font"></i>
                                 </button>
                                 <button class="btn btn-sm btn-danger delete-btn" data-id="${permission.id}" title="Eliminar">
                                     <i class="fas fa-trash"></i>
                                 </button>
                                 <button class="btn btn-sm ${permission.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                         data-id="${permission.id}" data-active="${permission.isActive}" title="${permission.isActive ? 'Desactivar' : 'Activar'}">
                                     <i class="fas fa-${permission.isActive ? 'times' : 'check'}"></i>
                                 </button>
                             </div>
                         </td>
                     </tr>
                 `;
             });
             
             permissionTableBody.innerHTML = html;
             showMessage(`${permissions.length} permisos cargados correctamente`, 'success');
             
             // Agregar event listeners a los botones
             addButtonEventListeners();
         })
         .catch(error => {
             console.error('Error cargando permisos:', error);
             permissionTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">
                 <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
             </td></tr>`;
             showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar permisos: ${error.message}`, 'danger');
         });
 }
 
 // Añadir event listeners a los botones en la tabla
 function addButtonEventListeners() {
     document.querySelectorAll('.edit-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const permissionId = this.getAttribute('data-id');
             getPermissionById(permissionId);
         });
     });
     
     document.querySelectorAll('.update-name-desc-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const permissionId = this.getAttribute('data-id');
             getPermissionForPartialUpdate(permissionId);
         });
     });
     
     document.querySelectorAll('.delete-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const permissionId = this.getAttribute('data-id');
             deletePermission(permissionId);
         });
     });
     
     document.querySelectorAll('.toggle-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const permissionId = this.getAttribute('data-id');
             const currentStatus = this.getAttribute('data-active') === 'true';
             togglePermissionStatus(permissionId, !currentStatus);
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
 
 // Crear permiso
 function createPermission(permissionData) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Creando permiso...', 'info');
     
     fetch(API_URL, {
         method: 'POST',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(permissionData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Permiso creado correctamente', 'success');
         loadPermissions(); // Recargar la tabla
         addPermissionModal.hide();
         document.getElementById('addPermissionForm').reset();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al crear permiso: ${error.message}`, 'danger');
     });
 }
 
 // Eliminar permiso
 function deletePermission(id) {
     if (!confirm('¿Está seguro de eliminar este permiso?')) return;
     
     showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando permiso...', 'info');
     
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
         showMessage('<i class="fas fa-check-circle"></i> Permiso eliminado correctamente', 'success');
         loadPermissions(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar permiso: ${error.message}`, 'danger');
     });
 }
 
 // Cambiar estado de permiso
 function togglePermissionStatus(id, newStatus) {
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
         loadPermissions(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
     });
 }
 
 // Obtener permiso por ID
 function getPermissionById(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del permiso...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(permission => {
             // Llenar formulario
             document.getElementById('editPermissionId').value = permission.id;
             document.getElementById('editName').value = permission.name;
             document.getElementById('editDescription').value = permission.description || '';
             document.getElementById('editIsActive').checked = permission.isActive;
             document.getElementById('editCreatedAt').value = formatDate(permission.createdAt);
             
             editPermissionModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del permiso: ${error.message}`, 'danger');
         });
 }
 
 // Obtener permiso para actualización parcial (nombre y descripción)
 function getPermissionForPartialUpdate(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del permiso...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(permission => {
             // Llenar formulario
             document.getElementById('partialPermissionId').value = permission.id;
             document.getElementById('partialName').value = permission.name;
             document.getElementById('partialDescription').value = permission.description || '';
             
             updateNameDescModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del permiso: ${error.message}`, 'danger');
         });
 }
 
 // Actualizar permiso
 function updatePermission(id, permissionData) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando permiso...', 'info');
     
     fetch(`${API_URL}/${id}`, {
         method: 'PUT',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(permissionData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Permiso actualizado correctamente', 'success');
         loadPermissions(); // Recargar la tabla
         editPermissionModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar permiso: ${error.message}`, 'danger');
     });
 }
 
 // Actualizar parcialmente el permiso (nombre y descripción)
 function updateNameDescription(id, name, description) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando nombre y descripción...', 'info');
     
     const permissionData = {
         id: parseInt(id),
         name: name,
         description: description
     };
     
     fetch(`${API_URL}/${id}/Name-Description`, {
         method: 'PATCH',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(permissionData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Nombre y descripción actualizados correctamente', 'success');
         loadPermissions(); // Recargar la tabla
         updateNameDescModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar nombre y descripción: ${error.message}`, 'danger');
     });
 }
 
 // Event listeners
 document.addEventListener('DOMContentLoaded', function() {
     // Inicializar modales de Bootstrap 5
     addPermissionModal = new bootstrap.Modal(document.getElementById('addPermissionModal'));
     editPermissionModal = new bootstrap.Modal(document.getElementById('editPermissionModal'));
     updateNameDescModal = new bootstrap.Modal(document.getElementById('updateNameDescModal'));
     
     // Cargar datos al iniciar
     loadPermissions();
     
     // Event listeners para botones
     loadDataBtn.addEventListener('click', loadPermissions);
     testAPIBtn.addEventListener('click', testAPI);
     
     addPermissionBtn.addEventListener('click', function() {
         document.getElementById('addPermissionForm').reset();
         addPermissionModal.show();
     });
     
     savePermissionBtn.addEventListener('click', function() {
         const permissionData = {
             name: document.getElementById('name').value,
             description: document.getElementById('description').value || null,
             isActive: document.getElementById('isActive').checked
         };
         
         // Validaciones
         if (!permissionData.name) {
             showMessage('Por favor, ingrese un nombre para el permiso', 'warning');
             return;
         }
         
         createPermission(permissionData);
     });
     
     updatePermissionBtn.addEventListener('click', function() {
         const id = document.getElementById('editPermissionId').value;
         const permissionData = {
             id: parseInt(id),
             name: document.getElementById('editName').value,
             description: document.getElementById('editDescription').value || null,
             isActive: document.getElementById('editIsActive').checked
         };
         
         // Validaciones
         if (!permissionData.name) {
             showMessage('Por favor, ingrese un nombre para el permiso', 'warning');
             return;
         }
         
         updatePermission(id, permissionData);
     });
     
     saveNameDescBtn.addEventListener('click', function() {
         const id = document.getElementById('partialPermissionId').value;
         const name = document.getElementById('partialName').value;
         const description = document.getElementById('partialDescription').value || null;
         
         // Validaciones
         if (!name) {
             showMessage('Por favor, ingrese un nombre para el permiso', 'warning');
             return;
         }
         
         updateNameDescription(id, name, description);
     });
 });