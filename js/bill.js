 // Configuración API
 const API_URL = 'https://localhost:7182/api/Bill';
 const PAYMENT_AGREEMENT_API_URL = 'https://localhost:7182/api/PaymentAgreement';
 const PAYMENT_USER_API_URL = 'https://localhost:7182/api/PaymentUser';
 
 // Elementos DOM
 const billTableBody = document.getElementById('billTableBody');
 const statusMessage = document.getElementById('statusMessage');
 const loadDataBtn = document.getElementById('loadDataBtn');
 const testAPIBtn = document.getElementById('testAPIBtn');
 const addBillBtn = document.getElementById('addBillBtn');
 const saveBillBtn = document.getElementById('saveBillBtn');
 const updateBillBtn = document.getElementById('updateBillBtn');
 const saveBillDataBtn = document.getElementById('saveBillDataBtn');
 
 // Referencias a modales para Bootstrap 5
 let addBillModal;
 let editBillModal;
 let updateBillDataModal;
 let viewPaymentsModal;
 
 // Cache de datos
 let paymentAgreements = [];
 
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
     return date.toLocaleDateString();
 }
 
 // Formatear valor monetario
 function formatMoney(value) {
     return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
 }
 
 // Obtener clase para el badge de estado según el valor
 function getStateBadgeClass(state) {
     if (!state) return 'state-pending';
     
     switch(state.toLowerCase()) {
         case 'pagado':
             return 'state-paid';
         case 'vencido':
             return 'state-expired';
         default:
             return 'state-pending';
     }
 }
 
 // Cargar acuerdos de pago para los selectores
 function loadPaymentAgreements() {
     return fetch(PAYMENT_AGREEMENT_API_URL)
         .then(response => {
             if (!response.ok) {
                 if (response.status === 404) {
                     return [];
                 }
                 throw new Error(`Error al cargar acuerdos de pago: ${response.status}`);
             }
             return response.json();
         })
         .then(data => {
             paymentAgreements = Array.isArray(data) ? data : [data];
             
             // Llenar los selectores
             const selectors = ['paymentAgreementId', 'editPaymentAgreementId'];
             selectors.forEach(id => {
                 const selector = document.getElementById(id);
                 if (selector) {
                     // Mantener la opción por defecto
                     const defaultOption = selector.options[0];
                     selector.innerHTML = '';
                     selector.appendChild(defaultOption);
                     
                     // Añadir las opciones
                     paymentAgreements.forEach(agreement => {
                         const option = document.createElement('option');
                         option.value = agreement.id;
                         option.textContent = `Acuerdo #${agreement.id} - ${agreement.description || 'Sin descripción'}`;
                         selector.appendChild(option);
                     });
                 }
             });
             
             return true;
         })
         .catch(error => {
             console.error('Error al cargar acuerdos de pago:', error);
             return false;
         });
 }
 
 // Cargar facturas desde la API
 function loadBills() {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando facturas...', 'info');
     
     // Primero cargar acuerdos de pago
     loadPaymentAgreements();
     
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
                 billTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No hay facturas disponibles</td></tr>';
                 showMessage('No hay facturas disponibles en el sistema', 'warning');
                 return;
             }
             
             // Asegurarse de que data sea un array
             const bills = Array.isArray(data) ? data : [data];
             
             // Construir la tabla
             let html = '';
             bills.forEach(bill => {
                 html += `
                     <tr>
                         <td>${bill.id}</td>
                         <td>${bill.barcode}</td>
                         <td>${formatDate(bill.issueDate)}</td>
                         <td>${formatDate(bill.expirationDate)}</td>
                         <td>${formatMoney(bill.totalValue)}</td>
                         <td>
                             <span class="badge state-badge ${getStateBadgeClass(bill.state)}">
                                 ${bill.state || 'Pendiente'}
                             </span>
                         </td>
                         <td>
                             <span class="badge ${bill.isActive ? 'bg-success' : 'bg-secondary'}">
                                 ${bill.isActive ? 'Activo' : 'Inactivo'}
                             </span>
                         </td>
                         <td>
                             <div class="btn-group" role="group">
                                 <button class="btn btn-sm btn-warning edit-btn" data-id="${bill.id}" title="Editar">
                                     <i class="fas fa-edit"></i>
                                 </button>
                                 <button class="btn btn-sm btn-info update-bill-data-btn" data-id="${bill.id}" title="Actualizar Datos">
                                     <i class="fas fa-info-circle"></i>
                                 </button>
                                 <button class="btn btn-sm btn-primary view-payments-btn" data-id="${bill.id}" data-barcode="${bill.barcode}" title="Ver Pagos">
                                     <i class="fas fa-money-bill-wave"></i>
                                 </button>
                                 <button class="btn btn-sm btn-danger delete-btn" data-id="${bill.id}" title="Eliminar">
                                     <i class="fas fa-trash"></i>
                                 </button>
                                 <button class="btn btn-sm ${bill.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                         data-id="${bill.id}" data-active="${bill.isActive}" title="${bill.isActive ? 'Desactivar' : 'Activar'}">
                                     <i class="fas fa-${bill.isActive ? 'times' : 'check'}"></i>
                                 </button>
                             </div>
                         </td>
                     </tr>
                 `;
             });
             
             billTableBody.innerHTML = html;
             showMessage(`${bills.length} facturas cargadas correctamente`, 'success');
             
             // Agregar event listeners a los botones
             addButtonEventListeners();
         })
         .catch(error => {
             console.error('Error cargando facturas:', error);
             billTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">
                 <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
             </td></tr>`;
             showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar facturas: ${error.message}`, 'danger');
         });
 }
 
 // Cargar pagos asociados a una factura
 function loadBillPayments(billId, billBarcode) {
     const tableBody = document.getElementById('billPaymentsTableBody');
     tableBody.innerHTML = '<tr><td colspan="5" class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando pagos...</td></tr>';
     
     // Actualizar el título del modal
     document.getElementById('billInfoDisplay').textContent = `Factura #${billId} - Código: ${billBarcode}`;
     
     // Aquí deberíamos tener un endpoint específico para obtener pagos por factura
     // Como es simulado, podemos intentar obtener todos los pagos y filtrar por billId
     fetch(`${PAYMENT_USER_API_URL}/bill/${billId}`)
         .then(response => {
             if (!response.ok) {
                 if (response.status === 404) {
                     // Si no existe el endpoint específico, simular que no hay pagos
                     return [];
                 }
                 throw new Error(`Error al cargar pagos: ${response.status}`);
             }
             return response.json();
         })
         .then(data => {
             const payments = Array.isArray(data) ? data : [data];
             
             if (payments.length === 0) {
                 tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay pagos asociados a esta factura</td></tr>';
                 return;
             }
             
             let html = '';
             payments.forEach(payment => {
                 html += `
                     <tr>
                         <td>${payment.id}</td>
                         <td>${payment.personName || `Persona #${payment.personId}`}</td>
                         <td>${formatMoney(payment.amount)}</td>
                         <td>${formatDate(payment.paymentDate)}</td>
                         <td>
                             <span class="badge ${payment.isActive ? 'bg-success' : 'bg-secondary'}">
                                 ${payment.isActive ? 'Activo' : 'Inactivo'}
                             </span>
                         </td>
                     </tr>
                 `;
             });
             
             tableBody.innerHTML = html;
         })
         .catch(error => {
             console.error('Error al cargar pagos:', error);
             tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">
                 Error: ${error.message}
             </td></tr>`;
         });
 }
 
 // Abrir modal para ver pagos asociados a factura
 function openViewPaymentsModal(billId, billBarcode) {
     loadBillPayments(billId, billBarcode);
     viewPaymentsModal.show();
 }
 
 // Añadir event listeners a los botones en la tabla
 function addButtonEventListeners() {
     document.querySelectorAll('.edit-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const billId = this.getAttribute('data-id');
             getBillById(billId);
         });
     });
     
     document.querySelectorAll('.update-bill-data-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const billId = this.getAttribute('data-id');
             getBillForDataUpdate(billId);
         });
     });
     
     document.querySelectorAll('.view-payments-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const billId = this.getAttribute('data-id');
             const billBarcode = this.getAttribute('data-barcode');
             openViewPaymentsModal(billId, billBarcode);
         });
     });
     
     document.querySelectorAll('.delete-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const billId = this.getAttribute('data-id');
             deleteBill(billId);
         });
     });
     
     document.querySelectorAll('.toggle-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const billId = this.getAttribute('data-id');
             const currentStatus = this.getAttribute('data-active') === 'true';
             toggleBillStatus(billId, !currentStatus);
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
 
 // Crear factura
 function createBill(billData) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Creando factura...', 'info');
     
     fetch(API_URL, {
         method: 'POST',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(billData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Factura creada correctamente', 'success');
         loadBills(); // Recargar la tabla
         addBillModal.hide();
         document.getElementById('addBillForm').reset();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al crear factura: ${error.message}`, 'danger');
     });
 }
 
 // Eliminar factura
 function deleteBill(id) {
     if (!confirm('¿Está seguro de eliminar esta factura?')) return;
     
     showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando factura...', 'info');
     
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
         showMessage('<i class="fas fa-check-circle"></i> Factura eliminada correctamente', 'success');
         loadBills(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar factura: ${error.message}`, 'danger');
     });
 }
 
 // Cambiar estado de factura
 function toggleBillStatus(id, newStatus) {
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
         loadBills(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
     });
 }
 
 // Obtener factura por ID
 function getBillById(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos de la factura...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(bill => {
             // Llenar formulario
             document.getElementById('editBillId').value = bill.id;
             document.getElementById('editBarcode').value = bill.barcode;
             document.getElementById('editIssueDate').value = formatDateForInput(bill.issueDate);
             document.getElementById('editExpirationDate').value = formatDateForInput(bill.expirationDate);
             document.getElementById('editTotalValue').value = bill.totalValue;
             document.getElementById('editState').value = bill.state || 'Pendiente';
             document.getElementById('editPaymentAgreementId').value = bill.paymentAgreementId || '';
             document.getElementById('editIsActive').checked = bill.isActive;
             
             editBillModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos de la factura: ${error.message}`, 'danger');
         });
 }
 
 // Obtener factura para actualización de datos
 function getBillForDataUpdate(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos de la factura...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(bill => {
             // Llenar formulario
             document.getElementById('billDataId').value = bill.id;
             document.getElementById('billDataBarcode').value = bill.barcode;
             document.getElementById('billDataIssueDate').value = formatDateForInput(bill.issueDate);
             document.getElementById('billDataExpirationDate').value = formatDateForInput(bill.expirationDate);
             document.getElementById('billDataTotalValue').value = bill.totalValue;
             document.getElementById('billDataState').value = bill.state || 'Pendiente';
             
             updateBillDataModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos de la factura: ${error.message}`, 'danger');
         });
 }
 
 // Formatear fecha para input type="date"
 function formatDateForInput(dateString) {
     if (!dateString) return '';
     const date = new Date(dateString);
     return date.toISOString().split('T')[0];
 }
 
 // Actualizar factura
 function updateBill(id, billData) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando factura...', 'info');
     
     fetch(`${API_URL}/${id}`, {
         method: 'PUT',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(billData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Factura actualizada correctamente', 'success');
         loadBills(); // Recargar la tabla
         editBillModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar factura: ${error.message}`, 'danger');
     });
 }
 
 // Actualizar datos básicos de factura
 function updateBillData(id, billData) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando datos de factura...', 'info');
     
     fetch(`${API_URL}/${id}/Update-Bill-Data`, {
         method: 'PATCH',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(billData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Datos de factura actualizados correctamente', 'success');
         loadBills(); // Recargar la tabla
         updateBillDataModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar datos de factura: ${error.message}`, 'danger');
     });
 }
 
 // Event listeners
 document.addEventListener('DOMContentLoaded', function() {
     // Inicializar modales de Bootstrap 5
     addBillModal = new bootstrap.Modal(document.getElementById('addBillModal'));
     editBillModal = new bootstrap.Modal(document.getElementById('editBillModal'));
     updateBillDataModal = new bootstrap.Modal(document.getElementById('updateBillDataModal'));
     viewPaymentsModal = new bootstrap.Modal(document.getElementById('viewPaymentsModal'));
     
     // Cargar datos al iniciar
     loadBills();
     
     // Event listeners para botones
     loadDataBtn.addEventListener('click', loadBills);
     testAPIBtn.addEventListener('click', testAPI);
     
     addBillBtn.addEventListener('click', function() {
         document.getElementById('addBillForm').reset();
         
         // Establecer fechas por defecto
         const today = new Date().toISOString().split('T')[0];
         document.getElementById('issueDate').value = today;
         
         // Fecha de vencimiento por defecto (30 días después)
         const expirationDate = new Date();
         expirationDate.setDate(expirationDate.getDate() + 30);
         document.getElementById('expirationDate').value = expirationDate.toISOString().split('T')[0];
         
         addBillModal.show();
     });
     
     saveBillBtn.addEventListener('click', function() {
         const billData = {
             barcode: document.getElementById('barcode').value,
             issueDate: document.getElementById('issueDate').value,
             expirationDate: document.getElementById('expirationDate').value,
             totalValue: parseFloat(document.getElementById('totalValue').value),
             state: document.getElementById('state').value,
             isActive: document.getElementById('isActive').checked,
             paymentAgreementId: document.getElementById('paymentAgreementId').value ? 
                 parseInt(document.getElementById('paymentAgreementId').value) : null
         };
         
         // Validaciones
         if (!billData.barcode) {
             showMessage('Por favor, ingrese un código de barras', 'warning');
             return;
         }
         if (!billData.issueDate) {
             showMessage('Por favor, seleccione una fecha de emisión', 'warning');
             return;
         }
         if (!billData.expirationDate) {
             showMessage('Por favor, seleccione una fecha de vencimiento', 'warning');
             return;
         }
         if (isNaN(billData.totalValue) || billData.totalValue <= 0) {
             showMessage('Por favor, ingrese un valor total válido', 'warning');
             return;
         }
         
         createBill(billData);
     });
     
     updateBillBtn.addEventListener('click', function() {
         const id = document.getElementById('editBillId').value;
         const billData = {
             id: parseInt(id),
             barcode: document.getElementById('editBarcode').value,
             issueDate: document.getElementById('editIssueDate').value,
             expirationDate: document.getElementById('editExpirationDate').value,
             totalValue: parseFloat(document.getElementById('editTotalValue').value),
             state: document.getElementById('editState').value,
             isActive: document.getElementById('editIsActive').checked,
             paymentAgreementId: document.getElementById('editPaymentAgreementId').value ? 
                 parseInt(document.getElementById('editPaymentAgreementId').value) : null
         };
         
         // Validaciones similares a las de creación
         if (!billData.barcode) {
             showMessage('Por favor, ingrese un código de barras', 'warning');
             return;
         }
         // ... otras validaciones ...
         
         updateBill(id, billData);
     });
     
     saveBillDataBtn.addEventListener('click', function() {
         const id = document.getElementById('billDataId').value;
         const billData = {
             id: parseInt(id),
             barcode: document.getElementById('billDataBarcode').value,
             issueDate: document.getElementById('billDataIssueDate').value,
             expirationDate: document.getElementById('billDataExpirationDate').value,
             totalValue: parseFloat(document.getElementById('billDataTotalValue').value),
             state: document.getElementById('billDataState').value
         };
         
         // Validaciones
         if (!billData.barcode) {
             showMessage('Por favor, ingrese un código de barras', 'warning');
             return;
         }
         // ... otras validaciones ...
         
         updateBillData(id, billData);
     });
 });