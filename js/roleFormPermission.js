 // Configuración API
 const API_URL = 'https://localhost:7182/api/RoleFormPermission';
 const ROLE_API_URL = 'https://localhost:7182/api/Role';
 const FORM_API_URL = 'https://localhost:7182/api/Form';
 const PERMISSION_API_URL = 'https://localhost:7182/api/Permission';
 
 // Elementos DOM
 const roleFormPermissionTableBody = document.getElementById('roleFormPermissionTableBody');
 const statusMessage = document.getElementById('statusMessage');
 const loadDataBtn = document.getElementById('loadDataBtn');
 const testAPIBtn = document.getElementById('testAPIBtn');
 const addRoleFormPermissionBtn = document.getElementById('addRoleFormPermissionBtn');
 const saveRoleFormPermissionBtn = document.getElementById('saveRoleFormPermissionBtn');
 const updateRoleFormPermissionBtn = document.getElementById('updateRoleFormPermissionBtn');
 const savePermissionsBtn = document.getElementById('savePermissionsBtn');
 
 // Referencias a modales para Bootstrap 5
 let addRoleFormPermissionModal;
 let editRoleFormPermissionModal;
 let updatePermissionsModal;
 
 // Cache de datos
 let roles = [];
 let forms = [];
 let permissions = [];
 
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
 
 // Cargar datos relacionados (roles, formularios, permisos)
 async function loadRelatedData() {
     try {
         // Cargar roles
         const rolesResponse = await fetch(ROLE_API_URL);
         if (!rolesResponse.ok) {
             throw new Error(`Error al cargar roles: ${rolesResponse.status}`);
         }
         roles = await rolesResponse.json();
         
         // Cargar formularios
         const formsResponse = await fetch(FORM_API_URL);
         if (!formsResponse.ok) {
             throw new Error(`Error al cargar formularios: ${formsResponse.status}`);
         }
         forms = await formsResponse.json();
         
         // Cargar permisos
         const permissionsResponse = await fetch(PERMISSION_API_URL);
         if (!permissionsResponse.ok) {
             throw new Error(`Error al cargar permisos: ${permissionsResponse.status}`);
         }
         permissions = await permissionsResponse.json();
         
         // Llenar los selectores
         fillSelectors();
         
         return true;
     } catch (error) {
         console.error('Error al cargar datos relacionados:', error);
         showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar datos relacionados: ${error.message}`, 'danger');
         return false;
     }
 }
 
 // Llenar los selectores con los datos relacionados
 function fillSelectors() {
     // Selectores de roles
     const roleSelectors = [
         document.getElementById('roleId'),
         document.getElementById('editRoleId')
     ];
     
     // Selectores de formularios
     const formSelectors = [
         document.getElementById('formId'),
         document.getElementById('editFormId')
     ];
     
     // Selectores de permisos
     const permissionSelectors = [
         document.getElementById('permissionId'),
         document.getElementById('editPermissionId')
     ];
     
     // Llenar selectores de roles
     roleSelectors.forEach(selector => {
         if (!selector) return;
         
         // Mantener la opción predeterminada
         const defaultOption = selector.options[0];
         selector.innerHTML = '';
         selector.appendChild(defaultOption);
         
         // Agregar opciones de roles
         roles.forEach(role => {
             const option = document.createElement('option');
             option.value = role.id;
             option.textContent = role.roleName;
             selector.appendChild(option);
         });
     });
     
     // Llenar selectores de formularios
     formSelectors.forEach(selector => {
         if (!selector) return;
         
         // Mantener la opción predeterminada
         const defaultOption = selector.options[0];
         selector.innerHTML = '';
         selector.appendChild(defaultOption);
         
         // Agregar opciones de formularios
         forms.forEach(form => {
             const option = document.createElement('option');
             option.value = form.id;
             option.textContent = form.name;
             selector.appendChild(option);
         });
     });
     
     // Llenar selectores de permisos
     permissionSelectors.forEach(selector => {
         if (!selector) return;
         
         // Mantener la opción predeterminada
         const defaultOption = selector.options[0];
         selector.innerHTML = '';
         selector.appendChild(defaultOption);
         
         // Agregar opciones de permisos
         permissions.forEach(permission => {
             const option = document.createElement('option');
             option.value = permission.id;
             option.textContent = permission.name;
             selector.appendChild(option);
         });
     });
 }
 
 // Obtener nombre de rol por ID
 function getRoleName(roleId) {
     const role = roles.find(r => r.id === roleId);
     return role ? role.roleName : `Rol ID: ${roleId}`;
 }
 
 // Obtener nombre de formulario por ID
 function getFormName(formId) {
     const form = forms.find(f => f.id === formId);
     return form ? form.name : `Formulario ID: ${formId}`;
 }
 
 // Obtener nombre de permiso por ID
 function getPermissionName(permissionId) {
     const permission = permissions.find(p => p.id === permissionId);
     return permission ? permission.name : `Permiso ID: ${permissionId}`;
 }
 
 // Renderizar badges de permisos específicos
 function renderPermissionBadges(canCreate, canRead, canUpdate, canDelete) {
     return `
         <span class="permission-badge ${canCreate ? 'permission-on' : 'permission-off'}" title="Crear">C</span>
         <span class="permission-badge ${canRead ? 'permission-on' : 'permission-off'}" title="Leer">R</span>
         <span class="permission-badge ${canUpdate ? 'permission-on' : 'permission-off'}" title="Actualizar">U</span>
         <span class="permission-badge ${canDelete ? 'permission-on' : 'permission-off'}" title="Eliminar">D</span>
     `;
 }
 
 // Cargar permisos de roles en formularios desde la API
 async function loadRoleFormPermissions() {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando permisos de roles en formularios...', 'info');
     
     try {
         // Primero cargar datos relacionados
         await loadRelatedData();
         
         const response = await fetch(API_URL);
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         
         const data = await response.json();
         console.log('Datos recibidos:', data);
         
         if (!data || (Array.isArray(data) && data.length === 0)) {
             roleFormPermissionTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay permisos asignados disponibles</td></tr>';
             showMessage('No hay permisos asignados disponibles en el sistema', 'warning');
             return;
         }
         
         // Asegurarse de que data sea un array
         const roleFormPermissions = Array.isArray(data) ? data : [data];
         
         // Construir la tabla
         let html = '';
         roleFormPermissions.forEach(rfp => {
             html += `
                 <tr>
                     <td>${rfp.id}</td>
                     <td>${getRoleName(rfp.roleId)}</td>
                     <td>${getFormName(rfp.formId)}</td>
                     <td>${getPermissionName(rfp.permissionId)}</td>
                     <td>
                         ${renderPermissionBadges(rfp.canCreate, rfp.canRead, rfp.canUpdate, rfp.canDelete)}
                     </td>
                     <td>
                         <span class="badge ${rfp.isActive ? 'bg-success' : 'bg-secondary'}">
                             ${rfp.isActive ? 'Activo' : 'Inactivo'}
                         </span>
                     </td>
                     <td>
                         <div class="btn-group" role="group">
                             <button class="btn btn-sm btn-warning edit-btn" data-id="${rfp.id}" title="Editar">
                                 <i class="fas fa-edit"></i>
                             </button>
                             <button class="btn btn-sm btn-info update-permissions-btn" data-id="${rfp.id}" title="Actualizar Permisos">
                                 <i class="fas fa-key"></i>
                             </button>
                             <button class="btn btn-sm btn-danger delete-btn" data-id="${rfp.id}" title="Eliminar">
                                 <i class="fas fa-trash"></i>
                             </button>
                             <button class="btn btn-sm ${rfp.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                     data-id="${rfp.id}" data-active="${rfp.isActive}" title="${rfp.isActive ? 'Desactivar' : 'Activar'}">
                                 <i class="fas fa-${rfp.isActive ? 'times' : 'check'}"></i>
                             </button>
                         </div>
                     </td>
                 </tr>
             `;
         });
         
         roleFormPermissionTableBody.innerHTML = html;
         showMessage(`${roleFormPermissions.length} permisos asignados cargados correctamente`, 'success');
         
         // Agregar event listeners a los botones
         addButtonEventListeners();
     } catch (error) {
         console.error('Error cargando permisos de roles en formularios:', error);
         roleFormPermissionTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">
             <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
         </td></tr>`;
         showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar permisos de roles en formularios: ${error.message}`, 'danger');
     }
 }
 
 // Añadir event listeners a los botones en la tabla
 function addButtonEventListeners() {
     document.querySelectorAll('.edit-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const id = this.getAttribute('data-id');
             getRoleFormPermissionById(id);
         });
     });
     
     document.querySelectorAll('.update-permissions-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const id = this.getAttribute('data-id');
             getRoleFormPermissionForPermissionsUpdate(id);
         });
     });
     
     document.querySelectorAll('.delete-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const id = this.getAttribute('data-id');
             deleteRoleFormPermission(id);
         });
     });
     
     document.querySelectorAll('.toggle-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const id = this.getAttribute('data-id');
             const currentStatus = this.getAttribute('data-active') === 'true';
             toggleRoleFormPermissionStatus(id, !currentStatus);
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
 
 // Crear permiso de rol en formulario
 function createRoleFormPermission(data) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Creando permiso de rol en formulario...', 'info');
     
     fetch(API_URL, {
         method: 'POST',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(data)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Permiso de rol en formulario creado correctamente', 'success');
         loadRoleFormPermissions(); // Recargar la tabla
         addRoleFormPermissionModal.hide();
         document.getElementById('addRoleFormPermissionForm').reset();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al crear permiso de rol en formulario: ${error.message}`, 'danger');
     });
 }
 
 // Eliminar permiso de rol en formulario
 function deleteRoleFormPermission(id) {
     if (!confirm('¿Está seguro de eliminar este permiso de rol en formulario?')) return;
     
     showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando permiso de rol en formulario...', 'info');
     
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
         showMessage('<i class="fas fa-check-circle"></i> Permiso de rol en formulario eliminado correctamente', 'success');
         loadRoleFormPermissions(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar permiso de rol en formulario: ${error.message}`, 'danger');
     });
 }
 
 // Cambiar estado de permiso de rol en formulario
 function toggleRoleFormPermissionStatus(id, newStatus) {
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
         loadRoleFormPermissions(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
     });
 }
 
 // Obtener permiso de rol en formulario por ID
 function getRoleFormPermissionById(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del permiso de rol en formulario...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(rfp => {
             // Llenar formulario
             document.getElementById('editRoleFormPermissionId').value = rfp.id;
             document.getElementById('editRoleId').value = rfp.roleId;
             document.getElementById('editFormId').value = rfp.formId;
             document.getElementById('editPermissionId').value = rfp.permissionId;
             document.getElementById('editCanCreate').checked = rfp.canCreate;
             document.getElementById('editCanRead').checked = rfp.canRead;
             document.getElementById('editCanUpdate').checked = rfp.canUpdate;
             document.getElementById('editCanDelete').checked = rfp.canDelete;
             document.getElementById('editIsActive').checked = rfp.isActive;
             
             editRoleFormPermissionModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del permiso de rol en formulario: ${error.message}`, 'danger');
         });
 }
 
 // Obtener permiso de rol en formulario para actualizar permisos específicos
 function getRoleFormPermissionForPermissionsUpdate(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos de permisos...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(rfp => {
             // Llenar formulario
             document.getElementById('permissionsRoleFormPermissionId').value = rfp.id;
             document.getElementById('permissionsCanCreate').checked = rfp.canCreate;
             document.getElementById('permissionsCanRead').checked = rfp.canRead;
             document.getElementById('permissionsCanUpdate').checked = rfp.canUpdate;
             document.getElementById('permissionsCanDelete').checked = rfp.canDelete;
             
             // Mostrar detalles de la relación
             const detailsLabel = document.getElementById('permissionDetailsLabel');
             detailsLabel.textContent = `Rol: ${getRoleName(rfp.roleId)} | Formulario: ${getFormName(rfp.formId)} | Permiso: ${getPermissionName(rfp.permissionId)}`;
             
             updatePermissionsModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos de permisos: ${error.message}`, 'danger');
         });
 }
 
 // Actualizar permiso de rol en formulario
 function updateRoleFormPermission(id, data) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando permiso de rol en formulario...', 'info');
     
     fetch(`${API_URL}/${id}`, {
         method: 'PUT',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(data)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Permiso de rol en formulario actualizado correctamente', 'success');
         loadRoleFormPermissions(); // Recargar la tabla
         editRoleFormPermissionModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar permiso de rol en formulario: ${error.message}`, 'danger');
     });
 }
 
 // Actualizar solo los permisos específicos
 function updatePermissions(id, canCreate, canRead, canUpdate, canDelete) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando permisos específicos...', 'info');
     
     const data = {
         id: parseInt(id),
         canCreate: canCreate,
         canRead: canRead,
         canUpdate: canUpdate,
         canDelete: canDelete
     };
     
     fetch(`${API_URL}/${id}/permissions`, {
         method: 'PATCH',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(data)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Permisos específicos actualizados correctamente', 'success');
         loadRoleFormPermissions(); // Recargar la tabla
         updatePermissionsModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar permisos específicos: ${error.message}`, 'danger');
     });
 }
 
 // Event listeners
 document.addEventListener('DOMContentLoaded', function() {
     // Inicializar modales de Bootstrap 5
     addRoleFormPermissionModal = new bootstrap.Modal(document.getElementById('addRoleFormPermissionModal'));
     editRoleFormPermissionModal = new bootstrap.Modal(document.getElementById('editRoleFormPermissionModal'));
     updatePermissionsModal = new bootstrap.Modal(document.getElementById('updatePermissionsModal'));
     
     // Cargar datos al iniciar
     loadRoleFormPermissions();
     
     // Event listeners para botones
     loadDataBtn.addEventListener('click', loadRoleFormPermissions);
     testAPIBtn.addEventListener('click', testAPI);
     
     addRoleFormPermissionBtn.addEventListener('click', function() {
         loadRelatedData().then(() => {
             document.getElementById('addRoleFormPermissionForm').reset();
             
             // Establecer valores predeterminados para los checkboxes
             document.getElementById('canCreate').checked = true;
             document.getElementById('canRead').checked = true;
             document.getElementById('canUpdate').checked = true;
             document.getElementById('canDelete').checked = true;
             document.getElementById('isActive').checked = true;
             
             addRoleFormPermissionModal.show();
         });
     });
     
     saveRoleFormPermissionBtn.addEventListener('click', function() {
         const data = {
             roleId: parseInt(document.getElementById('roleId').value),
             formId: parseInt(document.getElementById('formId').value),
             permissionId: parseInt(document.getElementById('permissionId').value),
             canCreate: document.getElementById('canCreate').checked,
             canRead: document.getElementById('canRead').checked,
             canUpdate: document.getElementById('canUpdate').checked,
             canDelete: document.getElementById('canDelete').checked,
             isActive: document.getElementById('isActive').checked
         };
         
         // Validaciones
         if (!data.roleId) {
             showMessage('Por favor, seleccione un rol', 'warning');
             return;
         }
         if (!data.formId) {
             showMessage('Por favor, seleccione un formulario', 'warning');
             return;
         }
         if (!data.permissionId) {
             showMessage('Por favor, seleccione un permiso', 'warning');
             return;
         }
         
         createRoleFormPermission(data);
     });
     
     updateRoleFormPermissionBtn.addEventListener('click', function() {
         const id = document.getElementById('editRoleFormPermissionId').value;
         const data = {
             id: parseInt(id),
             roleId: parseInt(document.getElementById('editRoleId').value),
             formId: parseInt(document.getElementById('editFormId').value),
             permissionId: parseInt(document.getElementById('editPermissionId').value),
             canCreate: document.getElementById('editCanCreate').checked,
             canRead: document.getElementById('editCanRead').checked,
             canUpdate: document.getElementById('editCanUpdate').checked,
             canDelete: document.getElementById('editCanDelete').checked,
             isActive: document.getElementById('editIsActive').checked
         };
         
         // Validaciones
         if (!data.roleId) {
             showMessage('Por favor, seleccione un rol', 'warning');
             return;
         }
         if (!data.formId) {
             showMessage('Por favor, seleccione un formulario', 'warning');
             return;
         }
         if (!data.permissionId) {
             showMessage('Por favor, seleccione un permiso', 'warning');
             return;
         }
         
         updateRoleFormPermission(id, data);
     });
     
     savePermissionsBtn.addEventListener('click', function() {
         const id = document.getElementById('permissionsRoleFormPermissionId').value;
         const canCreate = document.getElementById('permissionsCanCreate').checked;
         const canRead = document.getElementById('permissionsCanRead').checked;
         const canUpdate = document.getElementById('permissionsCanUpdate').checked;
         const canDelete = document.getElementById('permissionsCanDelete').checked;
         
         updatePermissions(id, canCreate, canRead, canUpdate, canDelete);
     });
 });