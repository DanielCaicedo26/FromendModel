 // Configuración API
 const API_URL = 'https://localhost:7182/api/Form';
        
 // Elementos DOM
 const formTableBody = document.getElementById('formTableBody');
 const statusMessage = document.getElementById('statusMessage');
 const loadDataBtn = document.getElementById('loadDataBtn');
 const testAPIBtn = document.getElementById('testAPIBtn');
 const addFormBtn = document.getElementById('addFormBtn');
 const saveFormBtn = document.getElementById('saveFormBtn');
 const updateFormBtn = document.getElementById('updateFormBtn');
 const saveBasicInfoBtn = document.getElementById('saveBasicInfoBtn');
 
 // Referencias a modales para Bootstrap 5
 let addFormModal;
 let editFormModal;
 let updateBasicInfoModal;
 
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
 
 // Obtener clase para el badge de estado según el valor
 function getStatusBadgeClass(status) {
     if (!status) return 'status-draft';
     
     switch(status.toLowerCase()) {
         case 'publicado':
             return 'status-published';
         case 'archivado':
             return 'status-inactive';
         default:
             return 'status-draft';
     }
 }
 
 // Cargar formularios desde la API
 function loadForms() {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando formularios...', 'info');
     
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
                 formTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay formularios disponibles</td></tr>';
                 showMessage('No hay formularios disponibles en el sistema', 'warning');
                 return;
             }
             
             // Asegurarse de que data sea un array
             const forms = Array.isArray(data) ? data : [data];
             
             // Construir la tabla
             let html = '';
             forms.forEach(form => {
                 html += `
                     <tr>
                         <td>${form.id}</td>
                         <td>${form.name}</td>
                         <td class="description-cell" title="${form.description || ''}">${form.description || 'Sin descripción'}</td>
                         <td>${formatDate(form.dateCreation)}</td>
                         <td>
                             <span class="badge status-badge ${getStatusBadgeClass(form.status)}">
                                 ${form.status || 'Borrador'}
                             </span>
                         </td>
                         <td>
                             <span class="badge ${form.isActive ? 'bg-success' : 'bg-secondary'}">
                                 ${form.isActive ? 'Activo' : 'Inactivo'}
                             </span>
                         </td>
                         <td>
                             <div class="btn-group" role="group">
                                 <button class="btn btn-sm btn-warning edit-btn" data-id="${form.id}" title="Editar">
                                     <i class="fas fa-edit"></i>
                                 </button>
                                 <button class="btn btn-sm btn-info update-basic-btn" data-id="${form.id}" title="Actualizar Info Básica">
                                     <i class="fas fa-info-circle"></i>
                                 </button>
                                 <button class="btn btn-sm btn-danger delete-btn" data-id="${form.id}" title="Eliminar">
                                     <i class="fas fa-trash"></i>
                                 </button>
                                 <button class="btn btn-sm ${form.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                         data-id="${form.id}" data-active="${form.isActive}" title="${form.isActive ? 'Desactivar' : 'Activar'}">
                                     <i class="fas fa-${form.isActive ? 'times' : 'check'}"></i>
                                 </button>
                             </div>
                         </td>
                     </tr>
                 `;
             });
             
             formTableBody.innerHTML = html;
             showMessage(`${forms.length} formularios cargados correctamente`, 'success');
             
             // Agregar event listeners a los botones
             addButtonEventListeners();
         })
         .catch(error => {
             console.error('Error cargando formularios:', error);
             formTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">
                 <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
             </td></tr>`;
             showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar formularios: ${error.message}`, 'danger');
         });
 }
 
 // Añadir event listeners a los botones en la tabla
 function addButtonEventListeners() {
     document.querySelectorAll('.edit-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const formId = this.getAttribute('data-id');
             getFormById(formId);
         });
     });
     
     document.querySelectorAll('.update-basic-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const formId = this.getAttribute('data-id');
             getFormForBasicUpdate(formId);
         });
     });
     
     document.querySelectorAll('.delete-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const formId = this.getAttribute('data-id');
             deleteForm(formId);
         });
     });
     
     document.querySelectorAll('.toggle-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const formId = this.getAttribute('data-id');
             const currentStatus = this.getAttribute('data-active') === 'true';
             toggleFormStatus(formId, !currentStatus);
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
 
 // Crear formulario
 function createForm(formData) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Creando formulario...', 'info');
     
     fetch(API_URL, {
         method: 'POST',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(formData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Formulario creado correctamente', 'success');
         loadForms(); // Recargar la tabla
         addFormModal.hide();
         document.getElementById('addFormForm').reset();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al crear formulario: ${error.message}`, 'danger');
     });
 }
 
 // Eliminar formulario
 function deleteForm(id) {
     if (!confirm('¿Está seguro de eliminar este formulario?')) return;
     
     showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando formulario...', 'info');
     
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
         showMessage('<i class="fas fa-check-circle"></i> Formulario eliminado correctamente', 'success');
         loadForms(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar formulario: ${error.message}`, 'danger');
     });
 }
 
 // Cambiar estado de formulario
 function toggleFormStatus(id, newStatus) {
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
         loadForms(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
     });
 }
 
 // Obtener formulario por ID
 function getFormById(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del formulario...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(form => {
             // Llenar formulario
             document.getElementById('editFormId').value = form.id;
             document.getElementById('editName').value = form.name;
             document.getElementById('editDescription').value = form.description || '';
             document.getElementById('editStatus').value = form.status || 'Borrador';
             document.getElementById('editIsActive').checked = form.isActive;
             document.getElementById('editDateCreation').value = formatDate(form.dateCreation);
             
             editFormModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del formulario: ${error.message}`, 'danger');
         });
 }
 
 // Obtener formulario para actualización básica
 function getFormForBasicUpdate(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del formulario...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(form => {
             // Llenar formulario
             document.getElementById('basicInfoId').value = form.id;
             document.getElementById('basicInfoName').value = form.name;
             document.getElementById('basicInfoDescription').value = form.description || '';
             document.getElementById('basicInfoStatus').value = form.status || 'Borrador';
             
             updateBasicInfoModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del formulario: ${error.message}`, 'danger');
         });
 }
 
 // Actualizar formulario
 function updateForm(id, formData) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando formulario...', 'info');
     
     fetch(`${API_URL}/${id}`, {
         method: 'PUT',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(formData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Formulario actualizado correctamente', 'success');
         loadForms(); // Recargar la tabla
         editFormModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar formulario: ${error.message}`, 'danger');
     });
 }
 
 // Actualizar información básica del formulario
 function updateBasicInfo(id, name, description, status) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando información básica...', 'info');
     
     const formData = {
         id: parseInt(id),
         name: name,
         description: description,
         status: status
     };
     
     fetch(`${API_URL}/${id}/Update-Name-Description-Status`, {
         method: 'PATCH',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(formData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Información básica actualizada correctamente', 'success');
         loadForms(); // Recargar la tabla
         updateBasicInfoModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar información básica: ${error.message}`, 'danger');
     });
 }
 
 // Event listeners
 document.addEventListener('DOMContentLoaded', function() {
     // Inicializar modales de Bootstrap 5
     addFormModal = new bootstrap.Modal(document.getElementById('addFormModal'));
     editFormModal = new bootstrap.Modal(document.getElementById('editFormModal'));
     updateBasicInfoModal = new bootstrap.Modal(document.getElementById('updateBasicInfoModal'));
     
     // Cargar datos al iniciar
     loadForms();
     
     // Event listeners para botones
     loadDataBtn.addEventListener('click', loadForms);
     testAPIBtn.addEventListener('click', testAPI);
     
     addFormBtn.addEventListener('click', function() {
         document.getElementById('addFormForm').reset();
         addFormModal.show();
     });
     
     saveFormBtn.addEventListener('click', function() {
         const formData = {
             name: document.getElementById('name').value,
             description: document.getElementById('description').value || null,
             status: document.getElementById('status').value,
             isActive: document.getElementById('isActive').checked
         };
         
         // Validaciones
         if (!formData.name) {
             showMessage('Por favor, ingrese un nombre para el formulario', 'warning');
             return;
         }
         
         createForm(formData);
     });
     
     updateFormBtn.addEventListener('click', function() {
         const id = document.getElementById('editFormId').value;
         const formData = {
             id: parseInt(id),
             name: document.getElementById('editName').value,
             description: document.getElementById('editDescription').value || null,
             status: document.getElementById('editStatus').value,
             isActive: document.getElementById('editIsActive').checked,
             dateCreation: new Date(document.getElementById('editDateCreation').value) // Esto podría no funcionar correctamente
         };
         
         // Validaciones
         if (!formData.name) {
             showMessage('Por favor, ingrese un nombre para el formulario', 'warning');
             return;
         }
         
         updateForm(id, formData);
     });
     
     saveBasicInfoBtn.addEventListener('click', function() {
         const id = document.getElementById('basicInfoId').value;
         const name = document.getElementById('basicInfoName').value;
         const description = document.getElementById('basicInfoDescription').value || null;
         const status = document.getElementById('basicInfoStatus').value;
         
         // Validaciones
         if (!name) {
             showMessage('Por favor, ingrese un nombre para el formulario', 'warning');
             return;
         }
         
         updateBasicInfo(id, name, description, status);
     });
 });