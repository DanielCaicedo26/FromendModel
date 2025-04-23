 // Configuración API
 const API_URL = 'https://localhost:7182/api/ModuleForm';
 const MODULE_API_URL = 'https://localhost:7182/api/Module';
 const FORM_API_URL = 'https://localhost:7182/api/Form';
 
 // Elementos DOM
 const moduleFormTableBody = document.getElementById('moduleFormTableBody');
 const statusMessage = document.getElementById('statusMessage');
 const relationCounter = document.getElementById('relationCounter');
 const loadDataBtn = document.getElementById('loadDataBtn');
 const testAPIBtn = document.getElementById('testAPIBtn');
 const addModuleFormBtn = document.getElementById('addModuleFormBtn');
 const saveModuleFormBtn = document.getElementById('saveModuleFormBtn');
 const updateModuleFormBtn = document.getElementById('updateModuleFormBtn');
 const saveItemsBtn = document.getElementById('saveItemsBtn');
 
 // Filtros
 const moduleFilter = document.getElementById('moduleFilter');
 const formFilter = document.getElementById('formFilter');
 const statusFilter = document.getElementById('statusFilter');
 
 // Referencias a modales para Bootstrap 5
 let addModuleFormModal;
 let editModuleFormModal;
 let updateModuleFormItemsModal;
 
 // Cache de datos
 let modulesList = [];
 let formsList = [];
 let moduleFormsList = [];
 
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
 
 // Cargar datos de módulos y formularios
 async function loadModulesAndForms() {
     try {
         // Cargar módulos
         const modulesResponse = await fetch(MODULE_API_URL);
         if (!modulesResponse.ok) {
             throw new Error(`Error al cargar módulos: ${modulesResponse.status}`);
         }
         modulesList = await modulesResponse.json();
         
         // Cargar formularios
         const formsResponse = await fetch(FORM_API_URL);
         if (!formsResponse.ok) {
             throw new Error(`Error al cargar formularios: ${formsResponse.status}`);
         }
         formsList = await formsResponse.json();
         
         // Asegurarse de que son arrays
         modulesList = Array.isArray(modulesList) ? modulesList : [modulesList];
         formsList = Array.isArray(formsList) ? formsList : [formsList];
         
         // Llenar los selectores de filtros
         fillFilterSelectors();
         
         // Llenar los selectores de los modales
         fillModalSelectors();
         
         return true;
     } catch (error) {
         console.error('Error al cargar módulos y formularios:', error);
         showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar datos relacionados: ${error.message}`, 'danger');
         return false;
     }
 }
 
 // Llenar los selectores de filtros
 function fillFilterSelectors() {
     // Módulos
     moduleFilter.innerHTML = '<option value="">Todos los módulos</option>';
     modulesList.forEach(module => {
         const option = document.createElement('option');
         option.value = module.id;
         option.textContent = module.name;
         moduleFilter.appendChild(option);
     });
     
     // Formularios
     formFilter.innerHTML = '<option value="">Todos los formularios</option>';
     formsList.forEach(form => {
         const option = document.createElement('option');
         option.value = form.id;
         option.textContent = form.name;
         formFilter.appendChild(option);
     });
 }
 
 // Llenar los selectores en los modales
 function fillModalSelectors() {
     const moduleSelectors = [
         document.getElementById('moduleId'),
         document.getElementById('editModuleId'),
         document.getElementById('updateItemsModuleId')
     ];
     
     const formSelectors = [
         document.getElementById('formId'),
         document.getElementById('editFormId'),
         document.getElementById('updateItemsFormId')
     ];
     
     // Llenar selectores de módulos
     moduleSelectors.forEach(selector => {
         if (!selector) return;
         
         // Mantener la opción predeterminada
         selector.innerHTML = '<option value="">Seleccione un módulo</option>';
         
         // Agregar opciones de módulos
         modulesList.forEach(module => {
             const option = document.createElement('option');
             option.value = module.id;
             option.textContent = module.name;
             selector.appendChild(option);
         });
     });
     
     // Llenar selectores de formularios
     formSelectors.forEach(selector => {
         if (!selector) return;
         
         // Mantener la opción predeterminada
         selector.innerHTML = '<option value="">Seleccione un formulario</option>';
         
         // Agregar opciones de formularios
         formsList.forEach(form => {
             const option = document.createElement('option');
             option.value = form.id;
             option.textContent = form.name;
             selector.appendChild(option);
         });
     });
 }
 
 // Obtener nombre de módulo por ID
 function getModuleName(moduleId) {
     const module = modulesList.find(m => m.id === moduleId);
     return module ? module.name : `Módulo ID: ${moduleId}`;
 }
 
 // Obtener nombre de formulario por ID
 function getFormName(formId) {
     const form = formsList.find(f => f.id === formId);
     return form ? form.name : `Formulario ID: ${formId}`;
 }
 
 // Cargar relaciones módulo-formulario desde la API
 async function loadModuleFormRelations() {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando relaciones módulo-formulario...', 'info');
     
     try {
         // Primero cargar datos relacionados
         await loadModulesAndForms();
         
         const response = await fetch(API_URL);
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         
         const data = await response.json();
         console.log('Datos recibidos:', data);
         
         // Guardar en caché
         moduleFormsList = Array.isArray(data) ? data : [data];
         
         // Aplicar filtros si están seleccionados
         displayFilteredModuleFormRelations();
         
         return true;
     } catch (error) {
         console.error('Error cargando relaciones módulo-formulario:', error);
         moduleFormTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">
             <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
         </td></tr>`;
         showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar relaciones: ${error.message}`, 'danger');
         return false;
     }
 }
 
 // Mostrar relaciones filtradas
 function displayFilteredModuleFormRelations() {
     const selectedModuleId = moduleFilter.value ? parseInt(moduleFilter.value) : null;
     const selectedFormId = formFilter.value ? parseInt(formFilter.value) : null;
     const selectedStatus = statusFilter.value !== "" ? statusFilter.value === "true" : null;
     
     // Filtrar las relaciones
     let filteredRelations = [...moduleFormsList];
     
     if (selectedModuleId) {
         filteredRelations = filteredRelations.filter(rel => rel.moduleId === selectedModuleId);
     }
     
     if (selectedFormId) {
         filteredRelations = filteredRelations.filter(rel => rel.formId === selectedFormId);
     }
     
     if (selectedStatus !== null) {
         filteredRelations = filteredRelations.filter(rel => rel.isActive === selectedStatus);
     }
     
     // Actualizar contador
     relationCounter.textContent = `${filteredRelations.length} relaciones`;
     
     // Verificar si hay relaciones para mostrar
     if (filteredRelations.length === 0) {
         moduleFormTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay relaciones que coincidan con los filtros</td></tr>';
         return;
     }
     
     // Construir la tabla
     let html = '';
     filteredRelations.forEach(relation => {
         html += `
             <tr>
                 <td>${relation.id}</td>
                 <td>${getModuleName(relation.moduleId)}</td>
                 <td>${getFormName(relation.formId)}</td>
                 <td>
                     <span class="badge ${relation.isActive ? 'bg-success' : 'bg-secondary'}">
                         ${relation.isActive ? 'Activo' : 'Inactivo'}
                     </span>
                 </td>
                 <td>
                     <div class="btn-group" role="group">
                         <button class="btn btn-sm btn-warning edit-btn" data-id="${relation.id}" title="Editar">
                             <i class="fas fa-edit"></i>
                         </button>
                         <button class="btn btn-sm btn-info update-items-btn" data-id="${relation.id}" title="Actualizar Módulo/Formulario">
                             <i class="fas fa-exchange-alt"></i>
                         </button>
                         <button class="btn btn-sm btn-danger delete-btn" data-id="${relation.id}" title="Eliminar">
                             <i class="fas fa-trash"></i>
                         </button>
                         <button class="btn btn-sm ${relation.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                 data-id="${relation.id}" data-active="${relation.isActive}" title="${relation.isActive ? 'Desactivar' : 'Activar'}">
                             <i class="fas fa-${relation.isActive ? 'times' : 'check'}"></i>
                         </button>
                     </div>
                 </td>
             </tr>
         `;
     });
     
     moduleFormTableBody.innerHTML = html;
     
     // Agregar event listeners a los botones
     addButtonEventListeners();
     
     showMessage(`${filteredRelations.length} relaciones mostradas`, 'success');
 }
 
 // Añadir event listeners a los botones en la tabla
 function addButtonEventListeners() {
     document.querySelectorAll('.edit-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const id = this.getAttribute('data-id');
             getModuleFormById(id);
         });
     });
     
     document.querySelectorAll('.update-items-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const id = this.getAttribute('data-id');
             getModuleFormForItemsUpdate(id);
         });
     });
     
     document.querySelectorAll('.delete-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const id = this.getAttribute('data-id');
             deleteModuleForm(id);
         });
     });
     
     document.querySelectorAll('.toggle-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const id = this.getAttribute('data-id');
             const currentStatus = this.getAttribute('data-active') === 'true';
             toggleModuleFormStatus(id, !currentStatus);
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
 
 // Crear relación módulo-formulario
 function createModuleForm(data) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Creando relación módulo-formulario...', 'info');
     
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
         showMessage('<i class="fas fa-check-circle"></i> Relación módulo-formulario creada correctamente', 'success');
         loadModuleFormRelations(); // Recargar la tabla
         addModuleFormModal.hide();
         document.getElementById('addModuleFormForm').reset();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al crear relación: ${error.message}`, 'danger');
     });
 }
 
 // Eliminar relación módulo-formulario
 function deleteModuleForm(id) {
     if (!confirm('¿Está seguro de eliminar esta relación módulo-formulario?')) return;
     
     showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando relación...', 'info');
     
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
         showMessage('<i class="fas fa-check-circle"></i> Relación eliminada correctamente', 'success');
         loadModuleFormRelations(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar relación: ${error.message}`, 'danger');
     });
 }
 
 // Cambiar estado de una relación módulo-formulario
 function toggleModuleFormStatus(id, newStatus) {
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
         loadModuleFormRelations(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
     });
 }
 
 // Obtener relación módulo-formulario por ID
 function getModuleFormById(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos de la relación...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(relation => {
             // Llenar formulario
             document.getElementById('editModuleFormId').value = relation.id;
             document.getElementById('editModuleId').value = relation.moduleId;
             document.getElementById('editFormId').value = relation.formId;
             document.getElementById('editIsActive').checked = relation.isActive;
             
             editModuleFormModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos de la relación: ${error.message}`, 'danger');
         });
 }
 
 // Obtener relación para actualizar módulo y formulario
 function getModuleFormForItemsUpdate(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos de la relación...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(relation => {
             // Llenar formulario
             document.getElementById('updateItemsId').value = relation.id;
             document.getElementById('updateItemsModuleId').value = relation.moduleId;
             document.getElementById('updateItemsFormId').value = relation.formId;
             
             updateModuleFormItemsModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos de la relación: ${error.message}`, 'danger');
         });
 }
 
 // Actualizar relación módulo-formulario
 function updateModuleForm(id, data) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando relación...', 'info');
     
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
         showMessage('<i class="fas fa-check-circle"></i> Relación actualizada correctamente', 'success');
         loadModuleFormRelations(); // Recargar la tabla
         editModuleFormModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar relación: ${error.message}`, 'danger');
     });
 }
 
 // Actualizar solo módulo y formulario
 function updateModuleFormItems(id, moduleId, formId) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando módulo y formulario...', 'info');
     
     const data = {
         id: parseInt(id),
         moduleId: parseInt(moduleId),
         formId: parseInt(formId)
     };
     
     fetch(`${API_URL}/${id}/Update-FormId-ModuleId`, {
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
         showMessage('<i class="fas fa-check-circle"></i> Módulo y formulario actualizados correctamente', 'success');
         loadModuleFormRelations(); // Recargar la tabla
         updateModuleFormItemsModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar módulo y formulario: ${error.message}`, 'danger');
     });
 }
 
 // Event listeners
 document.addEventListener('DOMContentLoaded', function() {
     // Inicializar modales de Bootstrap 5
     addModuleFormModal = new bootstrap.Modal(document.getElementById('addModuleFormModal'));
     editModuleFormModal = new bootstrap.Modal(document.getElementById('editModuleFormModal'));
     updateModuleFormItemsModal = new bootstrap.Modal(document.getElementById('updateModuleFormItemsModal'));
     
     // Cargar datos al iniciar
     loadModuleFormRelations();
     
     // Event listeners para botones
     loadDataBtn.addEventListener('click', loadModuleFormRelations);
     testAPIBtn.addEventListener('click', testAPI);
     
     // Event listeners para filtros
     moduleFilter.addEventListener('change', displayFilteredModuleFormRelations);
     formFilter.addEventListener('change', displayFilteredModuleFormRelations);
     statusFilter.addEventListener('change', displayFilteredModuleFormRelations);
     
     addModuleFormBtn.addEventListener('click', function() {
         loadModulesAndForms().then(() => {
             document.getElementById('addModuleFormForm').reset();
             document.getElementById('isActive').checked = true;
             addModuleFormModal.show();
         });
     });
     
     saveModuleFormBtn.addEventListener('click', function() {
         const data = {
             moduleId: parseInt(document.getElementById('moduleId').value),
             formId: parseInt(document.getElementById('formId').value),
             isActive: document.getElementById('isActive').checked
         };
         
         // Validaciones
         if (!data.moduleId) {
             showMessage('Por favor, seleccione un módulo', 'warning');
             return;
         }
         if (!data.formId) {
             showMessage('Por favor, seleccione un formulario', 'warning');
             return;
         }
         
         createModuleForm(data);
     });
     
     updateModuleFormBtn.addEventListener('click', function() {
         const id = document.getElementById('editModuleFormId').value;
         const data = {
             id: parseInt(id),
             moduleId: parseInt(document.getElementById('editModuleId').value),
             formId: parseInt(document.getElementById('editFormId').value),
             isActive: document.getElementById('editIsActive').checked
         };
         
         // Validaciones
         if (!data.moduleId) {
             showMessage('Por favor, seleccione un módulo', 'warning');
             return;
         }
         if (!data.formId) {
             showMessage('Por favor, seleccione un formulario', 'warning');
             return;
         }
         
         updateModuleForm(id, data);
     });
     
     saveItemsBtn.addEventListener('click', function() {
         const id = document.getElementById('updateItemsId').value;
         const moduleId = document.getElementById('updateItemsModuleId').value;
         const formId = document.getElementById('updateItemsFormId').value;
         
         // Validaciones
         if (!moduleId) {
             showMessage('Por favor, seleccione un módulo', 'warning');
             return;
         }
         if (!formId) {
             showMessage('Por favor, seleccione un formulario', 'warning');
             return;
         }
         
         updateModuleFormItems(id, moduleId, formId);
     });
 });