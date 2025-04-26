  // Configuración API
  const API_URL = 'https://localhost:7182/api/PaymentHistory';
  const USER_API_URL = 'https://localhost:7182/api/User';
  const INFRACTION_API_URL = 'https://localhost:7182/api/InformationInfraction';
  
  // Elementos DOM
  const paymentHistoryTableBody = document.getElementById('paymentHistoryTableBody');
  const statusMessage = document.getElementById('statusMessage');
  const totalRecords = document.getElementById('totalRecords');
  const totalAmount = document.getElementById('totalAmount');
  const loadDataBtn = document.getElementById('loadDataBtn');
  const testAPIBtn = document.getElementById('testAPIBtn');
  const addPaymentHistoryBtn = document.getElementById('addPaymentHistoryBtn');
  const savePaymentHistoryBtn = document.getElementById('savePaymentHistoryBtn');
  const updatePaymentHistoryBtn = document.getElementById('updatePaymentHistoryBtn');
  const saveAmountDateBtn = document.getElementById('saveAmountDateBtn');
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  
  // Referencias a modales para Bootstrap 5
  let addPaymentHistoryModal;
  let editPaymentHistoryModal;
  let updateAmountDateModal;
  
  // Cache de datos
  let users = [];
  let infractions = [];
  
  // Formatear moneda
  function formatCurrency(amount) {
      return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN'
      }).format(amount);
  }
  
  // Formatear fecha
  function formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString();
  }
  
  // Formatear fecha para input datetime-local
  function formatDateForInput(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16); // formato YYYY-MM-DDThh:mm
  }
  
  // Obtener nombre de usuario por ID
  function getUsernameById(userId) {
      const user = users.find(u => u.id === userId);
      return user ? user.username : `Usuario ID: ${userId}`;
  }
  
  // Obtener infracción por ID
  function getInfractionById(infractionId) {
      if (!infractionId) return null;
      const infraction = infractions.find(i => i.id === infractionId);
      return infraction ? infraction : null;
  }
  
  // Cargar usuarios para selectores
  async function loadUsers() {
      try {
          const response = await fetch(USER_API_URL);
          if (!response.ok) {
              throw new Error(`Error al cargar usuarios: ${response.status}`);
          }
          
          users = await response.json();
          
          // Llenar selectores de usuario
          const userSelectors = ['userId', 'editUserId', 'filterUser'];
          userSelectors.forEach(selectorId => {
              const selector = document.getElementById(selectorId);
              if (!selector) return;
              
              // Mantener la opción predeterminada
              const defaultOption = selector.options[0];
              selector.innerHTML = '';
              selector.appendChild(defaultOption);
              
              // Añadir opciones de usuarios
              users.forEach(user => {
                  const option = document.createElement('option');
                  option.value = user.id;
                  option.textContent = `${user.username} (${user.email})`;
                  selector.appendChild(option);
              });
          });
          
          return true;
      } catch (error) {
          console.error('Error cargando usuarios:', error);
          showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar usuarios: ${error.message}`, 'danger');
          return false;
      }
  }
  
  // Cargar infracciones para selectores (simulado)
  async function loadInfractions() {
      try {
          // Esta llamada podría fallar si no existe el endpoint
          const response = await fetch(INFRACTION_API_URL);
          if (!response.ok) {
              return false; // No mostrar error, simplemente dejar vacío el selector
          }
          
          infractions = await response.json();
          
          // Llenar selectores de infracciones
          const infractionSelectors = ['informationInfractionId', 'editInformationInfractionId'];
          infractionSelectors.forEach(selectorId => {
              const selector = document.getElementById(selectorId);
              if (!selector) return;
              
              // Mantener la opción predeterminada
              const defaultOption = selector.options[0];
              selector.innerHTML = '';
              selector.appendChild(defaultOption);
              
              // Añadir opciones de infracciones
              infractions.forEach(infraction => {
                  const option = document.createElement('option');
                  option.value = infraction.id;
                  option.textContent = `Infracción #${infraction.id}`;
                  selector.appendChild(option);
              });
          });
          
          return true;
      } catch (error) {
          console.log('Infracciones no disponibles, no es un error crítico');
          return false;
      }
  }
  
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
  
  // Cargar historiales de pago desde la API con filtros
  function loadPaymentHistories(filters = {}) {
      showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando historiales de pago...', 'info');
      
      // Cargar datos relacionados primero
      Promise.all([loadUsers(), loadInfractions()]).then(() => {
          // Construir la URL con parámetros de filtro
          let url = API_URL;
          const queryParams = [];
          
          if (filters.userId) queryParams.push(`userId=${filters.userId}`);
          if (filters.dateFrom) queryParams.push(`dateFrom=${filters.dateFrom}`);
          if (filters.dateTo) queryParams.push(`dateTo=${filters.dateTo}`);
          
          if (queryParams.length > 0) {
              url += '?' + queryParams.join('&');
          }
          
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
                      paymentHistoryTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No hay historiales de pago disponibles</td></tr>';
                      totalRecords.textContent = '0';
                      totalAmount.textContent = '$0.00';
                      showMessage('No hay historiales de pago disponibles', 'warning');
                      return;
                  }
                  
                  // Asegurarse de que data sea un array
                  const paymentHistories = Array.isArray(data) ? data : [data];
                  
                  // Calcular el total
                  const total = paymentHistories.reduce((sum, payment) => sum + payment.amount, 0);
                  totalRecords.textContent = paymentHistories.length;
                  totalAmount.textContent = formatCurrency(total);
                  
                  // Construir la tabla
                  let html = '';
                  paymentHistories.forEach(payment => {
                      const amountClass = payment.amount >= 0 ? 'amount-positive' : 'amount-negative';
                      
                      html += `
                          <tr>
                              <td>${payment.id}</td>
                              <td>${getUsernameById(payment.userId)}</td>
                              <td class="amount-cell ${amountClass}">${formatCurrency(payment.amount)}</td>
                              <td class="date-cell">${formatDate(payment.paymentDate)}</td>
                              <td class="note-cell" title="${payment.note || ''}">${payment.note || '-'}</td>
                              <td class="date-cell">${formatDate(payment.createdAt)}</td>
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
                                      <button class="btn btn-sm btn-info update-amount-date-btn" data-id="${payment.id}" title="Actualizar Monto y Fecha">
                                          <i class="fas fa-money-bill-wave"></i>
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
                  
                  paymentHistoryTableBody.innerHTML = html;
                  showMessage(`${paymentHistories.length} historiales de pago cargados correctamente`, 'success');
                  
                  // Agregar event listeners a los botones
                  addButtonEventListeners();
              })
              .catch(error => {
                  console.error('Error cargando historiales de pago:', error);
                  paymentHistoryTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">
                      <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
                  </td></tr>`;
                  totalRecords.textContent = '0';
                  totalAmount.textContent = '$0.00';
                  showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar historiales de pago: ${error.message}`, 'danger');
              });
      });
  }
  
  // Añadir event listeners a los botones en la tabla
  function addButtonEventListeners() {
      document.querySelectorAll('.edit-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const paymentHistoryId = this.getAttribute('data-id');
              getPaymentHistoryById(paymentHistoryId);
          });
      });
      
      document.querySelectorAll('.update-amount-date-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const paymentHistoryId = this.getAttribute('data-id');
              getPaymentHistoryForAmountDateUpdate(paymentHistoryId);
          });
      });
      
      document.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const paymentHistoryId = this.getAttribute('data-id');
              deletePaymentHistory(paymentHistoryId);
          });
      });
      
      document.querySelectorAll('.toggle-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const paymentHistoryId = this.getAttribute('data-id');
              const currentStatus = this.getAttribute('data-active') === 'true';
              togglePaymentHistoryStatus(paymentHistoryId, !currentStatus);
          });
      });
  }
  
  // Aplicar filtros
  function applyFilters() {
      const userId = document.getElementById('filterUser').value;
      const dateFrom = document.getElementById('filterDateFrom').value;
      const dateTo = document.getElementById('filterDateTo').value;
      
      const filters = {};
      if (userId) filters.userId = userId;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      
      loadPaymentHistories(filters);
  }
  
  // Limpiar filtros
  function clearFilters() {
      document.getElementById('filterUser').value = '';
      document.getElementById('filterDateFrom').value = '';
      document.getElementById('filterDateTo').value = '';
      
      loadPaymentHistories();
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
  
  // Crear historial de pago
  function createPaymentHistory(paymentHistoryData) {
      showMessage('<i class="fas fa-spinner fa-spin"></i> Creando historial de pago...', 'info');
      
      fetch(API_URL, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentHistoryData)
      })
      .then(response => {
          if (!response.ok) {
              throw new Error(`Error de servidor: ${response.status}`);
          }
          return response.json();
      })
      .then(data => {
          showMessage('<i class="fas fa-check-circle"></i> Historial de pago creado correctamente', 'success');
          loadPaymentHistories(); // Recargar la tabla
          addPaymentHistoryModal.hide();
          document.getElementById('addPaymentHistoryForm').reset();
      })
      .catch(error => {
          showMessage(`<i class="fas fa-times-circle"></i> Error al crear historial de pago: ${error.message}`, 'danger');
      });
  }
  
  // Eliminar historial de pago
  function deletePaymentHistory(id) {
      if (!confirm('¿Está seguro de eliminar este historial de pago?')) return;
      
      showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando historial de pago...', 'info');
      
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
          showMessage('<i class="fas fa-check-circle"></i> Historial de pago eliminado correctamente', 'success');
          loadPaymentHistories(); // Recargar la tabla
      })
      .catch(error => {
          showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar historial de pago: ${error.message}`, 'danger');
      });
  }
  
  // Cambiar estado de historial de pago
  function togglePaymentHistoryStatus(id, newStatus) {
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
          loadPaymentHistories(); // Recargar la tabla
      })
      .catch(error => {
          showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
      });
  }
  
  // Obtener historial de pago por ID
  function getPaymentHistoryById(id) {
      showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del historial de pago...', 'info');
      
      fetch(`${API_URL}/${id}`)
          .then(response => {
              if (!response.ok) {
                  throw new Error(`Error de servidor: ${response.status}`);
              }
              return response.json();
          })
          .then(payment => {
              // Llenar formulario
              document.getElementById('editPaymentHistoryId').value = payment.id;
              document.getElementById('editUserId').value = payment.userId;
              document.getElementById('editAmount').value = payment.amount;
              document.getElementById('editPaymentDate').value = formatDateForInput(payment.paymentDate);
              document.getElementById('editNote').value = payment.note || '';
              document.getElementById('editInformationInfractionId').value = payment.informationInfractionId || '';
              document.getElementById('editIsActive').checked = payment.isActive;
              document.getElementById('editCreatedAt').value = formatDate(payment.createdAt);
              
              editPaymentHistoryModal.show();
              statusMessage.style.display = 'none';
          })
          .catch(error => {
              showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del historial de pago: ${error.message}`, 'danger');
          });
  }
  
  // Obtener historial de pago para actualizar monto y fecha
  function getPaymentHistoryForAmountDateUpdate(id) {
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
              document.getElementById('amountDatePaymentHistoryId').value = payment.id;
              document.getElementById('amountDateAmount').value = payment.amount;
              document.getElementById('amountDatePaymentDate').value = formatDateForInput(payment.paymentDate);
              
              // Mostrar detalles del pago
              const username = getUsernameById(payment.userId);
              document.getElementById('amountDatePaymentDetails').textContent = 
                  `ID: ${payment.id}, Usuario: ${username}, Creado: ${formatDate(payment.createdAt)}`;
              
              updateAmountDateModal.show();
              statusMessage.style.display = 'none';
          })
          .catch(error => {
              showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del pago: ${error.message}`, 'danger');
          });
  }
  
  // Actualizar historial de pago
  function updatePaymentHistory(id, paymentHistoryData) {
      showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando historial de pago...', 'info');
      
      fetch(`${API_URL}/${id}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentHistoryData)
      })
      .then(response => {
          if (!response.ok) {
              throw new Error(`Error de servidor: ${response.status}`);
          }
          return response.json();
      })
      .then(data => {
          showMessage('<i class="fas fa-check-circle"></i> Historial de pago actualizado correctamente', 'success');
          loadPaymentHistories(); // Recargar la tabla
          editPaymentHistoryModal.hide();
      })
      .catch(error => {
          showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar historial de pago: ${error.message}`, 'danger');
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
      
      fetch(`${API_URL}/${id}/UpdateAmountAndDate`, {
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
          loadPaymentHistories(); // Recargar la tabla
          updateAmountDateModal.hide();
      })
      .catch(error => {
          showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar monto y fecha: ${error.message}`, 'danger');
      });
  }
  
  // Event listeners
  document.addEventListener('DOMContentLoaded', function() {
      // Inicializar modales de Bootstrap 5
      addPaymentHistoryModal = new bootstrap.Modal(document.getElementById('addPaymentHistoryModal'));
      editPaymentHistoryModal = new bootstrap.Modal(document.getElementById('editPaymentHistoryModal'));
      updateAmountDateModal = new bootstrap.Modal(document.getElementById('updateAmountDateModal'));
      
      // Cargar datos al iniciar
      loadPaymentHistories();
      
      // Event listeners para botones
      loadDataBtn.addEventListener('click', loadPaymentHistories);
      testAPIBtn.addEventListener('click', testAPI);
      applyFiltersBtn.addEventListener('click', applyFilters);
      clearFiltersBtn.addEventListener('click', clearFilters);
      
      addPaymentHistoryBtn.addEventListener('click', function() {
          loadUsers().then(() => {
              loadInfractions().then(() => {
                  document.getElementById('addPaymentHistoryForm').reset();
                  document.getElementById('paymentDate').value = formatDateForInput(new Date());
                  document.getElementById('isActive').checked = true;
                  addPaymentHistoryModal.show();
              });
          });
      });
      
      savePaymentHistoryBtn.addEventListener('click', function() {
          const paymentHistoryData = {
              userId: parseInt(document.getElementById('userId').value),
              amount: parseFloat(document.getElementById('amount').value),
              paymentDate: document.getElementById('paymentDate').value,
              note: document.getElementById('note').value || null,
              informationInfractionId: document.getElementById('informationInfractionId').value 
                  ? parseInt(document.getElementById('informationInfractionId').value) 
                  : null,
              isActive: document.getElementById('isActive').checked
          };
          
          // Validaciones
          if (!paymentHistoryData.userId) {
              showMessage('Por favor, seleccione un usuario', 'warning');
              return;
          }
          if (isNaN(paymentHistoryData.amount)) {
              showMessage('Por favor, ingrese un monto válido', 'warning');
              return;
          }
          if (!paymentHistoryData.paymentDate) {
              showMessage('Por favor, ingrese una fecha de pago', 'warning');
              return;
          }
          
          createPaymentHistory(paymentHistoryData);
      });
      
      updatePaymentHistoryBtn.addEventListener('click', function() {
          const id = document.getElementById('editPaymentHistoryId').value;
          const paymentHistoryData = {
              id: parseInt(id),
              userId: parseInt(document.getElementById('editUserId').value),
              amount: parseFloat(document.getElementById('editAmount').value),
              paymentDate: document.getElementById('editPaymentDate').value,
              note: document.getElementById('editNote').value || null,
              informationInfractionId: document.getElementById('editInformationInfractionId').value 
                  ? parseInt(document.getElementById('editInformationInfractionId').value) 
                  : null,
              isActive: document.getElementById('editIsActive').checked
          };
          
          // Validaciones
          if (!paymentHistoryData.userId) {
              showMessage('Por favor, seleccione un usuario', 'warning');
              return;
          }
          if (isNaN(paymentHistoryData.amount)) {
              showMessage('Por favor, ingrese un monto válido', 'warning');
              return;
          }
          if (!paymentHistoryData.paymentDate) {
              showMessage('Por favor, ingrese una fecha de pago', 'warning');
              return;
          }
          
          updatePaymentHistory(id, paymentHistoryData);
      });
      
      saveAmountDateBtn.addEventListener('click', function() {
          const id = document.getElementById('amountDatePaymentHistoryId').value;
          const amount = document.getElementById('amountDateAmount').value;
          const paymentDate = document.getElementById('amountDatePaymentDate').value;
          
          // Validaciones
          if (isNaN(parseFloat(amount))) {
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