 // Configuración API
 const API_URL = 'https://localhost:7182/api/InformationInfraction';
        
 // Elementos DOM
 const infractionTableBody = document.getElementById('infractionTableBody');
 const statusMessage = document.getElementById('statusMessage');
 const loadDataBtn = document.getElementById('loadDataBtn');
 const testAPIBtn = document.getElementById('testAPIBtn');
 const addInfractionBtn = document.getElementById('addInfractionBtn');
 const saveInfractionBtn = document.getElementById('saveInfractionBtn');
 const updateInfractionBtn = document.getElementById('updateInfractionBtn');
 const saveSmldvBtn = document.getElementById('saveSmldvBtn');
 
 // Referencias a modales para Bootstrap 5
 let addInfractionModal;
 let editInfractionModal;
 let updateSmldvModal;
 
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
 
 // Formatear valores monetarios
 function formatMoney(value) {
     return new Intl.NumberFormat('es-CO', { 
         style: 'currency', 
         currency: 'COP',
         minimumFractionDigits: 2,
         maximumFractionDigits: 2
     }).format(value);
 }
 
 // Calcular valor total
 function calculateTotal(numer_smldv, value_smldv) {
     return numer_smldv * value_smldv;
 }
 
 // Calcular valor SMLDV
 function calculateSmldv(minimumWage) {
     // Asumiendo que el SMLDV es el salario mínimo mensual dividido entre 30
     return minimumWage / 30;
 }
 
 // Evento para calcular automáticamente el valor SMLDV al cambiar el salario mínimo
 function setupAutoCalculations(prefix = '') {
     const minimumWageField = document.getElementById(prefix + 'minimumWage');
     const valueSmldvField = document.getElementById(prefix + 'value_smldv');
     const numerSmldvField = document.getElementById(prefix + 'numer_smldv');
     const totalValueField = document.getElementById(prefix + 'totalValue');
     
     // Calcular SMLDV al cambiar salario mínimo
     if (minimumWageField && valueSmldvField) {
         minimumWageField.addEventListener('input', function() {
             const minimumWage = parseFloat(this.value) || 0;
             const smldv = calculateSmldv(minimumWage);
             valueSmldvField.value = smldv.toFixed(2);
             
             // Actualizar total si existe el campo
             if (numerSmldvField && totalValueField) {
                 const numer_smldv = parseInt(numerSmldvField.value) || 0;
                 totalValueField.value = calculateTotal(numer_smldv, smldv).toFixed(2);
             }
         });
     }
     
     // Calcular total al cambiar número de SMLDV o valor SMLDV
     if (numerSmldvField && valueSmldvField && totalValueField) {
         numerSmldvField.addEventListener('input', function() {
             const numer_smldv = parseInt(this.value) || 0;
             const value_smldv = parseFloat(valueSmldvField.value) || 0;
             totalValueField.value = calculateTotal(numer_smldv, value_smldv).toFixed(2);
         });
         
         valueSmldvField.addEventListener('input', function() {
             const numer_smldv = parseInt(numerSmldvField.value) || 0;
             const value_smldv = parseFloat(this.value) || 0;
             totalValueField.value = calculateTotal(numer_smldv, value_smldv).toFixed(2);
         });
     }
 }
 
 // Cargar infracciones desde la API
 function loadInfractions() {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando infracciones...', 'info');
     
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
                 infractionTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay infracciones disponibles</td></tr>';
                 showMessage('No hay infracciones disponibles en el sistema', 'warning');
                 return;
             }
             
             // Asegurarse de que data sea un array
             const infractions = Array.isArray(data) ? data : [data];
             
             // Construir la tabla
             let html = '';
             infractions.forEach(infraction => {
                 html += `
                     <tr>
                         <td>${infraction.id}</td>
                         <td>${infraction.numer_smldv}</td>
                         <td class="money-value">${formatMoney(infraction.minimumWage)}</td>
                         <td class="money-value">${formatMoney(infraction.value_smldv)}</td>
                         <td class="money-value">${formatMoney(infraction.totalValue)}</td>
                         <td>
                             <span class="badge ${infraction.isActive ? 'bg-success' : 'bg-secondary'}">
                                 ${infraction.isActive ? 'Activo' : 'Inactivo'}
                             </span>
                         </td>
                         <td>
                             <div class="btn-group" role="group">
                                 <button class="btn btn-sm btn-warning edit-btn" data-id="${infraction.id}" title="Editar">
                                     <i class="fas fa-edit"></i>
                                 </button>
                                 <button class="btn btn-sm btn-info update-smldv-btn" data-id="${infraction.id}" title="Actualizar Valores SMLDV">
                                     <i class="fas fa-dollar-sign"></i>
                                 </button>
                                 <button class="btn btn-sm btn-danger delete-btn" data-id="${infraction.id}" title="Eliminar">
                                     <i class="fas fa-trash"></i>
                                 </button>
                                 <button class="btn btn-sm ${infraction.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                         data-id="${infraction.id}" data-active="${infraction.isActive}" title="${infraction.isActive ? 'Desactivar' : 'Activar'}">
                                     <i class="fas fa-${infraction.isActive ? 'times' : 'check'}"></i>
                                 </button>
                             </div>
                         </td>
                     </tr>
                 `;
             });
             
             infractionTableBody.innerHTML = html;
             showMessage(`${infractions.length} infracciones cargadas correctamente`, 'success');
             
             // Agregar event listeners a los botones
             addButtonEventListeners();
         })
         .catch(error => {
             console.error('Error cargando infracciones:', error);
             infractionTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">
                 <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
             </td></tr>`;
             showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar infracciones: ${error.message}`, 'danger');
         });
 }
 
 // Añadir event listeners a los botones en la tabla
 function addButtonEventListeners() {
     document.querySelectorAll('.edit-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const infractionId = this.getAttribute('data-id');
             getInfractionById(infractionId);
         });
     });
     
     document.querySelectorAll('.update-smldv-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const infractionId = this.getAttribute('data-id');
             getInfractionForSmldvUpdate(infractionId);
         });
     });
     
     document.querySelectorAll('.delete-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const infractionId = this.getAttribute('data-id');
             deleteInfraction(infractionId);
         });
     });
     
     document.querySelectorAll('.toggle-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const infractionId = this.getAttribute('data-id');
             const currentStatus = this.getAttribute('data-active') === 'true';
             toggleInfractionStatus(infractionId, !currentStatus);
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
 
 // Crear infracción
 function createInfraction(infractionData) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Creando infracción...', 'info');
     
     fetch(API_URL, {
         method: 'POST',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(infractionData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Infracción creada correctamente', 'success');
         loadInfractions(); // Recargar la tabla
         addInfractionModal.hide();
         document.getElementById('addInfractionForm').reset();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al crear infracción: ${error.message}`, 'danger');
     });
 }
 
 // Eliminar infracción
 function deleteInfraction(id) {
     if (!confirm('¿Está seguro de eliminar esta infracción?')) return;
     
     showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando infracción...', 'info');
     
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
         showMessage('<i class="fas fa-check-circle"></i> Infracción eliminada correctamente', 'success');
         loadInfractions(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar infracción: ${error.message}`, 'danger');
     });
 }
 
 // Cambiar estado de infracción
 function toggleInfractionStatus(id, newStatus) {
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
         loadInfractions(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
     });
 }
 
 // Obtener infracción por ID
 function getInfractionById(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos de la infracción...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(infraction => {
             // Llenar formulario
             document.getElementById('editInfractionId').value = infraction.id;
             document.getElementById('editNumer_smldv').value = infraction.numer_smldv;
             document.getElementById('editMinimumWage').value = infraction.minimumWage;
             document.getElementById('editValue_smldv').value = infraction.value_smldv;
             document.getElementById('editTotalValue').value = infraction.totalValue;
             document.getElementById('editIsActive').checked = infraction.isActive;
             
             editInfractionModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos de la infracción: ${error.message}`, 'danger');
         });
 }
 
 // Obtener infracción para actualizar valores SMLDV
 function getInfractionForSmldvUpdate(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos de la infracción...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(infraction => {
             // Llenar formulario
             document.getElementById('smldvInfractionId').value = infraction.id;
             document.getElementById('smldvNumer_smldv').value = infraction.numer_smldv;
             document.getElementById('smldvMinimumWage').value = infraction.minimumWage;
             document.getElementById('smldvValue_smldv').value = infraction.value_smldv;
             document.getElementById('smldvTotalValue').value = infraction.totalValue;
             
             updateSmldvModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos de la infracción: ${error.message}`, 'danger');
         });
 }
 
 // Actualizar infracción
 function updateInfraction(id, infractionData) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando infracción...', 'info');
     
     fetch(`${API_URL}/${id}`, {
         method: 'PUT',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(infractionData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Infracción actualizada correctamente', 'success');
         loadInfractions(); // Recargar la tabla
         editInfractionModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar infracción: ${error.message}`, 'danger');
     });
 }
 
 // Actualizar valores SMLDV de la infracción
 function updateSmldvValues(id, numer_smldv, minimumWage, value_smldv, totalValue) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando valores SMLDV...', 'info');
     
     const infractionData = {
         id: parseInt(id),
         numer_smldv: parseInt(numer_smldv),
         minimumWage: parseFloat(minimumWage),
         value_smldv: parseFloat(value_smldv),
         totalValue: parseFloat(totalValue)
     };
     
     fetch(`${API_URL}/${id}/Update-Smldv-Values`, {
         method: 'PATCH',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(infractionData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Valores SMLDV actualizados correctamente', 'success');
         loadInfractions(); // Recargar la tabla
         updateSmldvModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar valores SMLDV: ${error.message}`, 'danger');
     });
 }
 
 // Event listeners
 document.addEventListener('DOMContentLoaded', function() {
     // Inicializar modales de Bootstrap 5
     addInfractionModal = new bootstrap.Modal(document.getElementById('addInfractionModal'));
     editInfractionModal = new bootstrap.Modal(document.getElementById('editInfractionModal'));
     updateSmldvModal = new bootstrap.Modal(document.getElementById('updateSmldvModal'));
     
     // Configurar cálculos automáticos para todos los formularios
     setupAutoCalculations('');
     setupAutoCalculations('edit');
     setupAutoCalculations('smldv');
     
     // Cargar datos al iniciar
     loadInfractions();
     
     // Event listeners para botones
     loadDataBtn.addEventListener('click', loadInfractions);
     testAPIBtn.addEventListener('click', testAPI);
     
     addInfractionBtn.addEventListener('click', function() {
         document.getElementById('addInfractionForm').reset();
         addInfractionModal.show();
     });
     
     saveInfractionBtn.addEventListener('click', function() {
         const infractionData = {
             numer_smldv: parseInt(document.getElementById('numer_smldv').value),
             minimumWage: parseFloat(document.getElementById('minimumWage').value),
             value_smldv: parseFloat(document.getElementById('value_smldv').value),
             totalValue: parseFloat(document.getElementById('totalValue').value),
             isActive: document.getElementById('isActive').checked
         };
         
         // Validaciones
         if (isNaN(infractionData.numer_smldv) || infractionData.numer_smldv < 0) {
             showMessage('El número de SMLDV debe ser un valor entero positivo', 'warning');
             return;
         }
         
         if (isNaN(infractionData.minimumWage) || infractionData.minimumWage <= 0) {
             showMessage('El salario mínimo debe ser un valor numérico positivo', 'warning');
             return;
         }
         
         if (isNaN(infractionData.value_smldv) || infractionData.value_smldv <= 0) {
             showMessage('El valor SMLDV debe ser un valor numérico positivo', 'warning');
             return;
         }
         
         if (isNaN(infractionData.totalValue) || infractionData.totalValue <= 0) {
             showMessage('El valor total debe ser un valor numérico positivo', 'warning');
             return;
         }
         
         createInfraction(infractionData);
     });
     
     updateInfractionBtn.addEventListener('click', function() {
         const id = document.getElementById('editInfractionId').value;
         const infractionData = {
             id: parseInt(id),
             numer_smldv: parseInt(document.getElementById('editNumer_smldv').value),
             minimumWage: parseFloat(document.getElementById('editMinimumWage').value),
             value_smldv: parseFloat(document.getElementById('editValue_smldv').value),
             totalValue: parseFloat(document.getElementById('editTotalValue').value),
             isActive: document.getElementById('editIsActive').checked
         };
         
         // Validaciones
         if (isNaN(infractionData.numer_smldv) || infractionData.numer_smldv < 0) {
             showMessage('El número de SMLDV debe ser un valor entero positivo', 'warning');
             return;
         }
         
         if (isNaN(infractionData.minimumWage) || infractionData.minimumWage <= 0) {
             showMessage('El salario mínimo debe ser un valor numérico positivo', 'warning');
             return;
         }
         
         if (isNaN(infractionData.value_smldv) || infractionData.value_smldv <= 0) {
             showMessage('El valor SMLDV debe ser un valor numérico positivo', 'warning');
             return;
         }
         
         if (isNaN(infractionData.totalValue) || infractionData.totalValue <= 0) {
             showMessage('El valor total debe ser un valor numérico positivo', 'warning');
             return;
         }
         
         updateInfraction(id, infractionData);
     });
     
     saveSmldvBtn.addEventListener('click', function() {
         const id = document.getElementById('smldvInfractionId').value;
         const numer_smldv = document.getElementById('smldvNumer_smldv').value;
         const minimumWage = document.getElementById('smldvMinimumWage').value;
         const value_smldv = document.getElementById('smldvValue_smldv').value;
         const totalValue = document.getElementById('smldvTotalValue').value;
         
         // Validaciones
         if (isNaN(parseInt(numer_smldv)) || parseInt(numer_smldv) < 0) {
             showMessage('El número de SMLDV debe ser un valor entero positivo', 'warning');
             return;
         }
         
         if (isNaN(parseFloat(minimumWage)) || parseFloat(minimumWage) <= 0) {
             showMessage('El salario mínimo debe ser un valor numérico positivo', 'warning');
             return;
         }
         
         if (isNaN(parseFloat(value_smldv)) || parseFloat(value_smldv) <= 0) {
             showMessage('El valor SMLDV debe ser un valor numérico positivo', 'warning');
             return;
         }
         
         if (isNaN(parseFloat(totalValue)) || parseFloat(totalValue) <= 0) {
             showMessage('El valor total debe ser un valor numérico positivo', 'warning');
             return;
         }
         
         updateSmldvValues(id, numer_smldv, minimumWage, value_smldv, totalValue);
     });
 });