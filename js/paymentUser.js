 // Configuración API
 const API_URL = 'https://localhost:7182/api/PaymentUser';
 const PERSON_API_URL = 'https://localhost:7182/api/Person';
 const TYPE_PAYMENT_API_URL = 'https://localhost:7182/api/TypePayment';
 const BILL_API_URL = 'https://localhost:7182/api/Bill';
 const PAYMENT_AGREEMENT_API_URL = 'https://localhost:7182/api/PaymentAgreement';
 
 // Elementos DOM
 const paymentTableBody = document.getElementById('paymentTableBody');
 const statusMessage = document.getElementById('statusMessage');
 const loadDataBtn = document.getElementById('loadDataBtn');
 const testAPIBtn = document.getElementById('testAPIBtn');
 const addPaymentBtn = document.getElementById('addPaymentBtn');
 const savePaymentBtn = document.getElementById('savePaymentBtn');
 const updatePaymentBtn = document.getElementById('updatePaymentBtn');
 const saveAmountDateBtn = document.getElementById('saveAmountDateBtn');
 
 // Referencias a modales para Bootstrap 5
 let addPaymentModal;
 let editPaymentModal;
 let updateAmountDateModal;
 
 // Datos para listas desplegables
 let personsList = [];
 let typePaymentsList = [];
 let billsList = [];
 let paymentAgreementsList = [];
 
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
 
 // Formatear monto como moneda
 function formatAmount(amount) {
     return new Intl.NumberFormat('es-CO', { 
         style: 'currency', 
         currency: 'COP',
         minimumFractionDigits: 2
     }).format(amount);
 }
 
 // Cargar personas para los selectores
 async function loadPersons() {
     try {
         const response = await fetch(PERSON_API_URL);
         if (!response.ok) {
             throw new Error(`Error al cargar personas: ${response.status}`);
         }
         
         personsList = await response.json();
         
         // Llenar selectores
         const selectors = ['personId', 'editPersonId'];
         selectors.forEach(id => {
             const selector = document.getElementById(id);
             if (selector) {
                 // Mantener la primera opción
                 const defaultOption = selector.options[0];
                 selector.innerHTML = '';
                 selector.appendChild(defaultOption);
                 
                 // Añadir opciones
                 personsList.forEach(person => {
                     const option = document.createElement('option');
                     option.value = person.id;
                     option.textContent = `${person.firstName} ${person.lastName}`;
                     selector.appendChild(option);
                 });
             }
         });
         
         return true;
     } catch (error) {
         console.error('Error al cargar personas:', error);
         showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar personas: ${error.message}`, 'warning');
         return false;
     }
 }
 
 // Cargar tipos de pago para los selectores
 async function loadTypePayments() {
     try {
         const response = await fetch(TYPE_PAYMENT_API_URL);
         if (!response.ok) {
             // Si el endpoint no existe, creamos datos de ejemplo
             typePaymentsList = [
                 { id: 1, name: "Efectivo" },
                 { id: 2, name: "Tarjeta de Crédito" },
                 { id: 3, name: "Transferencia Bancaria" },
                 { id: 4, name: "Cheque" }
             ];
         } else {
             typePaymentsList = await response.json();
         }
         
         // Llenar selectores
         const selectors = ['typePaymentId', 'editTypePaymentId'];
         selectors.forEach(id => {
             const selector = document.getElementById(id);
             if (selector) {
                 // Mantener la primera opción
                 const defaultOption = selector.options[0];
                 selector.innerHTML = '';
                 selector.appendChild(defaultOption);
                 
                 // Añadir opciones
                 typePaymentsList.forEach(type => {
                     const option = document.createElement('option');
                     option.value = type.id;
                     option.textContent = type.name;
                     selector.appendChild(option);
                 });
             }
         });
         
         return true;
     } catch (error) {
         console.error('Error al cargar tipos de pago:', error);
         
         // Usar datos de ejemplo
         typePaymentsList = [
             { id: 1, name: "Efectivo" },
             { id: 2, name: "Tarjeta de Crédito" },
             { id: 3, name: "Transferencia Bancaria" },
             { id: 4, name: "Cheque" }
         ];
         
         // Llenar selectores con datos de ejemplo
         const selectors = ['typePaymentId', 'editTypePaymentId'];
         selectors.forEach(id => {
             const selector = document.getElementById(id);
             if (selector) {
                 // Mantener la primera opción
                 const defaultOption = selector.options[0];
                 selector.innerHTML = '';
                 selector.appendChild(defaultOption);
                 
                 // Añadir opciones
                 typePaymentsList.forEach(type => {
                     const option = document.createElement('option');
                     option.value = type.id;
                     option.textContent = type.name;
                     selector.appendChild(option);
                 });
             }
         });
         
         return true;
     }
 }
 
 // Cargar facturas para los selectores
 async function loadBills() {
     try {
         const response = await fetch(BILL_API_URL);
         if (!response.ok) {
             // Si el endpoint no existe, dejamos la lista vacía
             billsList = [];
         } else {
             billsList = await response.json();
         }
         
         // Llenar selectores
         const selectors = ['billId', 'editBillId'];
         selectors.forEach(id => {
             const selector = document.getElementById(id);
             if (selector) {
                 // Mantener la primera opción
                 const defaultOption = selector.options[0];
                 selector.innerHTML = '';
                 selector.appendChild(defaultOption);
                 
                 // Añadir opciones
                 billsList.forEach(bill => {
                     const option = document.createElement('option');
                     option.value = bill.id;
                     option.textContent = `Factura #${bill.id} - ${formatAmount(bill.amount)}`;
                     selector.appendChild(option);
                 });
             }
         });
         
         return true;
     } catch (error) {
         console.error('Error al cargar facturas:', error);
         return false;
     }
 }
 
 // Cargar acuerdos de pago para los selectores
 async function loadPaymentAgreements() {
     try {
         const response = await fetch(PAYMENT_AGREEMENT_API_URL);
         if (!response.ok) {
             // Si el endpoint no existe, dejamos la lista vacía
             paymentAgreementsList = [];
         } else {
             paymentAgreementsList = await response.json();
         }
         
         // Llenar selectores
         const selectors = ['paymentAgreementId', 'editPaymentAgreementId'];
         selectors.forEach(id => {
             const selector = document.getElementById(id);
             if (selector) {
                 // Mantener la primera opción
                 const defaultOption = selector.options[0];
                 selector.innerHTML = '';
                 selector.appendChild(defaultOption);
                 
                 // Añadir opciones
                 paymentAgreementsList.forEach(agreement => {
                     const option = document.createElement('option');
                     option.value = agreement.id;
                     option.textContent = `Acuerdo #${agreement.id}`;
                     selector.appendChild(option);
                 });
             }
         });
         
         return true;
     } catch (error) {
         console.error('Error al cargar acuerdos de pago:', error);
         return false;
     }
 }
 
 // Obtener nombre de persona
 function getPersonName(personId) {
     const person = personsList.find(p => p.id === personId);
     return person ? `${person.firstName} ${person.lastName}` : `Persona ID: ${personId}`;
 }
 
 // Obtener nombre de tipo de pago
 function getTypePaymentName(typePaymentId) {
     if (!typePaymentId) return 'No especificado';
     const typePayment = typePaymentsList.find(t => t.id === typePaymentId);
     return typePayment ? typePayment.name : `Tipo ID: ${typePaymentId}`;
 }
 
 // Cargar datos relacionados
 async function loadRelatedData() {
     await Promise.all([
         loadPersons(),
         loadTypePayments(),
         loadBills(),
         loadPaymentAgreements()
     ]);
 }
 
 // Cargar pagos desde la API
 async function loadPayments() {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando pagos...', 'info');
     
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
             paymentTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay pagos disponibles</td></tr>';
             showMessage('No hay pagos disponibles en el sistema', 'warning');
             return;
         }
         
         // Asegurarse de que data sea un array
         const payments = Array.isArray(data) ? data : [data];
         
         // Construir la tabla
         let html = '';
         payments.forEach(payment => {
             html += `
                 <tr>
                     <td>${payment.id}</td>
                     <td>${getPersonName(payment.personId)}</td>
                     <td class="amount-cell">${formatAmount(payment.amount)}</td>
                     <td>${formatDate(payment.paymentDate)}</td>
                     <td>${getTypePaymentName(payment.typePaymentId)}</td>
                     <td>
                         <span class="badge ${payment.isActive ? 'bg-success' : 'bg-secondary'}">
                             ${payment.isActive ? 'Activo' : 'Inactivo'}
                         </span>
                     </td>
                     <td>
                         <div class="btn-group" role="group">
                             <button class="btn btn-sm btn-warning edit-btn" data-id="${payment.id}" title="Editar">
                                 <i class="fas fa-edit"></i>
                             </button>
                             <button class="btn btn-sm btn-info update-amount-date-btn" data-id="${payment.id}" title="Actualizar Monto/Fecha">
                                 <i class="fas fa-dollar-sign"></i>
                             </button>
                             <button class="btn btn-sm btn-danger delete-btn" data-id="${payment.id}" title="Eliminar">
                                 <i class="fas fa-trash"></i>
                             </button>
                             <button class="btn btn-sm ${payment.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                     data-id="${payment.id}" data-active="${payment.isActive}" title="${payment.isActive ? 'Desactivar' : 'Activar'}">
                                 <i class="fas fa-${payment.isActive ? 'times' : 'check'}"></i>
                             </button>
                         </div>
                     </td>
                 </tr>
             `;
         });
         
         paymentTableBody.innerHTML = html;
         showMessage(`${payments.length} pagos cargados correctamente`, 'success');
         
         // Agregar event listeners a los botones
         addButtonEventListeners();
     } catch (error) {
         console.error('Error cargando pagos:', error);
         paymentTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">
             <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
         </td></tr>`;
         showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar pagos: ${error.message}`, 'danger');
     }
 }
 
 // Añadir event listeners a los botones en la tabla
 function addButtonEventListeners() {
     document.querySelectorAll('.edit-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const paymentId = this.getAttribute('data-id');
             getPaymentById(paymentId);
         });
     });
     
     document.querySelectorAll('.update-amount-date-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const paymentId = this.getAttribute('data-id');
             getPaymentForAmountDateUpdate(paymentId);
         });
     });
     
     document.querySelectorAll('.delete-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const paymentId = this.getAttribute('data-id');
             deletePayment(paymentId);
         });
     });
     
     document.querySelectorAll('.toggle-btn').forEach(btn => {
         btn.addEventListener('click', function() {
             const paymentId = this.getAttribute('data-id');
             const currentStatus = this.getAttribute('data-active') === 'true';
             togglePaymentStatus(paymentId, !currentStatus);
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
 
 // Crear pago
 function createPayment(paymentData) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Creando pago...', 'info');
     
     fetch(API_URL, {
         method: 'POST',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(paymentData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Pago creado correctamente', 'success');
         loadPayments(); // Recargar la tabla
         addPaymentModal.hide();
         document.getElementById('addPaymentForm').reset();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al crear pago: ${error.message}`, 'danger');
     });
 }
 
 // Eliminar pago
 function deletePayment(id) {
     if (!confirm('¿Está seguro de eliminar este pago?')) return;
     
     showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando pago...', 'info');
     
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
         showMessage('<i class="fas fa-check-circle"></i> Pago eliminado correctamente', 'success');
         loadPayments(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar pago: ${error.message}`, 'danger');
     });
 }
 
 // Cambiar estado de pago
 function togglePaymentStatus(id, newStatus) {
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
         loadPayments(); // Recargar la tabla
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
     });
 }
 
 // Obtener pago por ID
 function getPaymentById(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del pago...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(payment => {
             // Llenar formulario
             document.getElementById('editPaymentId').value = payment.id;
             document.getElementById('editPersonId').value = payment.personId;
             document.getElementById('editAmount').value = payment.amount;
             
             // Formatear fecha para input datetime-local
             const paymentDate = new Date(payment.paymentDate);
             const formattedDate = paymentDate.toISOString().slice(0, 16);
             document.getElementById('editPaymentDate').value = formattedDate;
             
             document.getElementById('editTypePaymentId').value = payment.typePaymentId || '';
             document.getElementById('editBillId').value = payment.billId || '';
             document.getElementById('editPaymentAgreementId').value = payment.paymentAgreementId || '';
             document.getElementById('editCreatedAt').value = formatDate(payment.createdAt);
             document.getElementById('editIsActive').checked = payment.isActive;
             
             editPaymentModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del pago: ${error.message}`, 'danger');
         });
 }
 
 // Obtener pago para actualización de monto y fecha
 function getPaymentForAmountDateUpdate(id) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del pago...', 'info');
     
     fetch(`${API_URL}/${id}`)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`Error de servidor: ${response.status}`);
             }
             return response.json();
         })
         .then(payment => {
             // Llenar formulario
             document.getElementById('amountDatePaymentId').value = payment.id;
             document.getElementById('updateAmount').value = payment.amount;
             
             // Formatear fecha para input datetime-local
             const paymentDate = new Date(payment.paymentDate);
             const formattedDate = paymentDate.toISOString().slice(0, 16);
             document.getElementById('updatePaymentDate').value = formattedDate;
             
             // Mostrar nombre de la persona
             document.getElementById('updatePersonName').textContent = `Pago de: ${getPersonName(payment.personId)}`;
             
             updateAmountDateModal.show();
             statusMessage.style.display = 'none';
         })
         .catch(error => {
             showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del pago: ${error.message}`, 'danger');
         });
 }
 
 // Actualizar pago
 function updatePayment(id, paymentData) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando pago...', 'info');
     
     fetch(`${API_URL}/${id}`, {
         method: 'PUT',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(paymentData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Pago actualizado correctamente', 'success');
         loadPayments(); // Recargar la tabla
         editPaymentModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar pago: ${error.message}`, 'danger');
     });
 }
 
 // Actualizar monto y fecha de pago
 function updateAmountAndDate(id, amount, paymentDate) {
     showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando monto y fecha...', 'info');
     
     const paymentData = {
         id: parseInt(id),
         amount: parseFloat(amount),
         paymentDate: paymentDate
     };
     
     fetch(`${API_URL}/${id}/Amount-PaymentDate`, {
         method: 'PATCH',
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(paymentData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error de servidor: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         showMessage('<i class="fas fa-check-circle"></i> Monto y fecha actualizados correctamente', 'success');
         loadPayments(); // Recargar la tabla
         updateAmountDateModal.hide();
     })
     .catch(error => {
         showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar monto y fecha: ${error.message}`, 'danger');
     });
 }
 
 // Event listeners
 document.addEventListener('DOMContentLoaded', function() {
     // Inicializar modales de Bootstrap 5
     addPaymentModal = new bootstrap.Modal(document.getElementById('addPaymentModal'));
     editPaymentModal = new bootstrap.Modal(document.getElementById('editPaymentModal'));
     updateAmountDateModal = new bootstrap.Modal(document.getElementById('updateAmountDateModal'));
     
     // Cargar datos al iniciar
     loadPayments();
     
     // Event listeners para botones
     loadDataBtn.addEventListener('click', loadPayments);
     testAPIBtn.addEventListener('click', testAPI);
     
     addPaymentBtn.addEventListener('click', function() {
         loadRelatedData().then(() => {
             document.getElementById('addPaymentForm').reset();
             document.getElementById('isActive').checked = true;
             
             // Establecer fecha actual por defecto
             const now = new Date();
             const formattedNow = now.toISOString().slice(0, 16);
             document.getElementById('paymentDate').value = formattedNow;
             
             addPaymentModal.show();
         });
     });
     
     savePaymentBtn.addEventListener('click', function() {
         const paymentData = {
             personId: parseInt(document.getElementById('personId').value),
             amount: parseFloat(document.getElementById('amount').value),
             paymentDate: document.getElementById('paymentDate').value,
             typePaymentId: document.getElementById('typePaymentId').value ? parseInt(document.getElementById('typePaymentId').value) : null,
             billId: document.getElementById('billId').value ? parseInt(document.getElementById('billId').value) : null,
             paymentAgreementId: document.getElementById('paymentAgreementId').value ? parseInt(document.getElementById('paymentAgreementId').value) : null,
             isActive: document.getElementById('isActive').checked
         };
         
         // Validaciones
         if (!paymentData.personId) {
             showMessage('Por favor, seleccione una persona', 'warning');
             return;
         }
         
         if (!paymentData.amount || paymentData.amount <= 0) {
             showMessage('Por favor, ingrese un monto válido', 'warning');
             return;
         }
         
         if (!paymentData.paymentDate) {
             showMessage('Por favor, ingrese una fecha de pago', 'warning');
             return;
         }
         
         createPayment(paymentData);
     });
     
     updatePaymentBtn.addEventListener('click', function() {
         const id = document.getElementById('editPaymentId').value;
         const paymentData = {
             id: parseInt(id),
             personId: parseInt(document.getElementById('editPersonId').value),
             amount: parseFloat(document.getElementById('editAmount').value),
             paymentDate: document.getElementById('editPaymentDate').value,
             typePaymentId: document.getElementById('editTypePaymentId').value ? parseInt(document.getElementById('editTypePaymentId').value) : null,
             billId: document.getElementById('editBillId').value ? parseInt(document.getElementById('editBillId').value) : null,
             paymentAgreementId: document.getElementById('editPaymentAgreementId').value ? parseInt(document.getElementById('editPaymentAgreementId').value) : null,
             isActive: document.getElementById('editIsActive').checked
         };
         
         // Validaciones
         if (!paymentData.personId) {
             showMessage('Por favor, seleccione una persona', 'warning');
             return;
         }
         
         if (!paymentData.amount || paymentData.amount <= 0) {
             showMessage('Por favor, ingrese un monto válido', 'warning');
             return;
         }
         
         if (!paymentData.paymentDate) {
             showMessage('Por favor, ingrese una fecha de pago', 'warning');
             return;
         }
         
         updatePayment(id, paymentData);
     });
     
     saveAmountDateBtn.addEventListener('click', function() {
         const id = document.getElementById('amountDatePaymentId').value;
         const amount = document.getElementById('updateAmount').value;
         const paymentDate = document.getElementById('updatePaymentDate').value;
         
         // Validaciones
         if (!amount || parseFloat(amount) <= 0) {
             showMessage('Por favor, ingrese un monto válido', 'warning');
             return;
         }
         
         if (!paymentDate) {
             showMessage('Por favor, ingrese una fecha de pago', 'warning');
             return;
         }
         
         updateAmountAndDate(id, amount, paymentDate);
     });
 });
