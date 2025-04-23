const API_URL = 'https://localhost:7182/api/PaymentAgreement';
        
        // Elementos DOM
        const paymentAgreementTableBody = document.getElementById('paymentAgreementTableBody');
        const statusMessage = document.getElementById('statusMessage');
        const loadDataBtn = document.getElementById('loadDataBtn');
        const testAPIBtn = document.getElementById('testAPIBtn');
        const addPaymentAgreementBtn = document.getElementById('addPaymentAgreementBtn');
        const savePaymentAgreementBtn = document.getElementById('savePaymentAgreementBtn');
        const updatePaymentAgreementBtn = document.getElementById('updatePaymentAgreementBtn');
        const savePartialUpdateBtn = document.getElementById('savePartialUpdateBtn');
        
        // Referencias a modales para Bootstrap 5
        let addPaymentAgreementModal;
        let editPaymentAgreementModal;
        let partialUpdateModal;
        
        // Formatear número como moneda
        function formatCurrency(amount) {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 2
            }).format(amount);
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
        
        // Cargar acuerdos de pago desde la API
        function loadPaymentAgreements() {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando acuerdos de pago...', 'info');
            
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
                        paymentAgreementTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay acuerdos de pago disponibles</td></tr>';
                        showMessage('No hay acuerdos de pago disponibles en el sistema', 'warning');
                        return;
                    }
                    
                    // Asegurarse de que data sea un array
                    const paymentAgreements = Array.isArray(data) ? data : [data];
                    
                    // Construir la tabla
                    let html = '';
                    paymentAgreements.forEach(agreement => {
                        html += `
                            <tr>
                                <td>${agreement.id}</td>
                                <td>${agreement.address}</td>
                                <td>${agreement.neighborhood || 'N/A'}</td>
                                <td class="finance-amount">${formatCurrency(agreement.financeAmount)}</td>
                                <td class="description-cell" title="${agreement.agreementDescription || ''}">${agreement.agreementDescription || 'Sin descripción'}</td>
                                <td>
                                    <span class="badge ${agreement.isActive ? 'bg-success' : 'bg-secondary'}">
                                        ${agreement.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td>
                                    <div class="btn-group" role="group">
                                        <button class="btn btn-sm btn-warning edit-btn" data-id="${agreement.id}" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-info partial-update-btn" data-id="${agreement.id}" title="Actualización Parcial">
                                            <i class="fas fa-sliders-h"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger delete-btn" data-id="${agreement.id}" title="Eliminar">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                        <button class="btn btn-sm ${agreement.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                                data-id="${agreement.id}" data-active="${agreement.isActive}" title="${agreement.isActive ? 'Desactivar' : 'Activar'}">
                                            <i class="fas fa-${agreement.isActive ? 'times' : 'check'}"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                    
                    paymentAgreementTableBody.innerHTML = html;
                    showMessage(`${paymentAgreements.length} acuerdos de pago cargados correctamente`, 'success');
                    
                    // Agregar event listeners a los botones
                    addButtonEventListeners();
                })
                .catch(error => {
                    console.error('Error cargando acuerdos de pago:', error);
                    paymentAgreementTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">
                        <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
                    </td></tr>`;
                    showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar acuerdos de pago: ${error.message}`, 'danger');
                });
        }
        
        // Añadir event listeners a los botones en la tabla
        function addButtonEventListeners() {
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const agreementId = this.getAttribute('data-id');
                    getPaymentAgreementById(agreementId);
                });
            });
            
            document.querySelectorAll('.partial-update-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const agreementId = this.getAttribute('data-id');
                    getPaymentAgreementForPartialUpdate(agreementId);
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const agreementId = this.getAttribute('data-id');
                    deletePaymentAgreement(agreementId);
                });
            });
            
            document.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const agreementId = this.getAttribute('data-id');
                    const currentStatus = this.getAttribute('data-active') === 'true';
                    togglePaymentAgreementStatus(agreementId, !currentStatus);
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
        
        // Crear acuerdo de pago
        function createPaymentAgreement(paymentAgreementData) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Creando acuerdo de pago...', 'info');
            
            fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentAgreementData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error de servidor: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                showMessage('<i class="fas fa-check-circle"></i> Acuerdo de pago creado correctamente', 'success');
                loadPaymentAgreements(); // Recargar la tabla
                addPaymentAgreementModal.hide();
                document.getElementById('addPaymentAgreementForm').reset();
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al crear acuerdo de pago: ${error.message}`, 'danger');
            });
        }
        
        // Eliminar acuerdo de pago
        function deletePaymentAgreement(id) {
            if (!confirm('¿Está seguro de eliminar este acuerdo de pago?')) return;
            
            showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando acuerdo de pago...', 'info');
            
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
                showMessage('<i class="fas fa-check-circle"></i> Acuerdo de pago eliminado correctamente', 'success');
                loadPaymentAgreements(); // Recargar la tabla
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar acuerdo de pago: ${error.message}`, 'danger');
            });
        }
        
        // Cambiar estado de acuerdo de pago
        function togglePaymentAgreementStatus(id, newStatus) {
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
                loadPaymentAgreements(); // Recargar la tabla
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
            });
        }
        
        // Obtener acuerdo de pago por ID
        function getPaymentAgreementById(id) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del acuerdo de pago...', 'info');
            
            fetch(`${API_URL}/${id}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error de servidor: ${response.status}`);
                    }
                    return response.json();
                })
                .then(agreement => {
                    // Llenar formulario
                    document.getElementById('editPaymentAgreementId').value = agreement.id;
                    document.getElementById('editAddress').value = agreement.address;
                    document.getElementById('editNeighborhood').value = agreement.neighborhood || '';
                    document.getElementById('editFinanceAmount').value = agreement.financeAmount;
                    document.getElementById('editAgreementDescription').value = agreement.agreementDescription || '';
                    document.getElementById('editIsActive').checked = agreement.isActive;
                    
                    editPaymentAgreementModal.show();
                    statusMessage.style.display = 'none';
                })
                .catch(error => {
                    showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del acuerdo de pago: ${error.message}`, 'danger');
                });
        }
        
        // Obtener acuerdo de pago para actualización parcial
        function getPaymentAgreementForPartialUpdate(id) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del acuerdo de pago...', 'info');
            
            fetch(`${API_URL}/${id}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error de servidor: ${response.status}`);
                    }
                    return response.json();
                })
                .then(agreement => {
                    // Llenar formulario
                    document.getElementById('partialUpdateId').value = agreement.id;
                    document.getElementById('partialAddress').value = agreement.address;
                    document.getElementById('partialNeighborhood').value = agreement.neighborhood || '';
                    document.getElementById('partialFinanceAmount').value = agreement.financeAmount;
                    document.getElementById('partialAgreementDescription').value = agreement.agreementDescription || '';
                    
                    partialUpdateModal.show();
                    statusMessage.style.display = 'none';
                })
                .catch(error => {
                    showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del acuerdo de pago: ${error.message}`, 'danger');
                });
        }
        
        // Actualizar acuerdo de pago
        function updatePaymentAgreement(id, paymentAgreementData) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando acuerdo de pago...', 'info');
            
            fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentAgreementData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error de servidor: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                showMessage('<i class="fas fa-check-circle"></i> Acuerdo de pago actualizado correctamente', 'success');
                loadPaymentAgreements(); // Recargar la tabla
                editPaymentAgreementModal.hide();
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar acuerdo de pago: ${error.message}`, 'danger');
            });
        }
        
        // Actualización parcial del acuerdo de pago
        function updatePartial(id, address, neighborhood, financeAmount, agreementDescription) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando acuerdo de pago...', 'info');
            
            const paymentAgreementData = {
                id: parseInt(id),
                address: address,
                neighborhood: neighborhood,
                financeAmount: parseFloat(financeAmount),
                agreementDescription: agreementDescription
            };
            
            fetch(`${API_URL}/${id}/PartialUpdate`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentAgreementData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error de servidor: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                showMessage('<i class="fas fa-check-circle"></i> Acuerdo de pago actualizado correctamente', 'success');
                loadPaymentAgreements(); // Recargar la tabla
                partialUpdateModal.hide();
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar acuerdo de pago: ${error.message}`, 'danger');
            });
        }
        
        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Inicializar modales de Bootstrap 5
            addPaymentAgreementModal = new bootstrap.Modal(document.getElementById('addPaymentAgreementModal'));
            editPaymentAgreementModal = new bootstrap.Modal(document.getElementById('editPaymentAgreementModal'));
            partialUpdateModal = new bootstrap.Modal(document.getElementById('partialUpdateModal'));
            
            // Cargar datos al iniciar
            loadPaymentAgreements();
            
            // Event listeners para botones
            loadDataBtn.addEventListener('click', loadPaymentAgreements);
            testAPIBtn.addEventListener('click', testAPI);
            
            addPaymentAgreementBtn.addEventListener('click', function() {
                document.getElementById('addPaymentAgreementForm').reset();
                addPaymentAgreementModal.show();
            });
            
            savePaymentAgreementBtn.addEventListener('click', function() {
                const paymentAgreementData = {
                    address: document.getElementById('address').value,
                    neighborhood: document.getElementById('neighborhood').value || null,
                    financeAmount: parseFloat(document.getElementById('financeAmount').value),
                    agreementDescription: document.getElementById('agreementDescription').value || null,
                    isActive: document.getElementById('isActive').checked
                };
                
                // Validaciones
                if (!paymentAgreementData.address) {
                    showMessage('Por favor, ingrese una dirección para el acuerdo de pago', 'warning');
                    return;
                }
                
                if (isNaN(paymentAgreementData.financeAmount) || paymentAgreementData.financeAmount <= 0) {
                    showMessage('Por favor, ingrese un monto a financiar válido', 'warning');
                    return;
                }
                
                createPaymentAgreement(paymentAgreementData);
            });
            
            updatePaymentAgreementBtn.addEventListener('click', function() {
                const id = document.getElementById('editPaymentAgreementId').value;
                const paymentAgreementData = {
                    id: parseInt(id),
                    address: document.getElementById('editAddress').value,
                    neighborhood: document.getElementById('editNeighborhood').value || null,
                    financeAmount: parseFloat(document.getElementById('editFinanceAmount').value),
                    agreementDescription: document.getElementById('editAgreementDescription').value || null,
                    isActive: document.getElementById('editIsActive').checked
                };
                
                // Validaciones
                if (!paymentAgreementData.address) {
                    showMessage('Por favor, ingrese una dirección para el acuerdo de pago', 'warning');
                    return;
                }
                
                if (isNaN(paymentAgreementData.financeAmount) || paymentAgreementData.financeAmount <= 0) {
                    showMessage('Por favor, ingrese un monto a financiar válido', 'warning');
                    return;
                }
                
                updatePaymentAgreement(id, paymentAgreementData);
            });
            
            savePartialUpdateBtn.addEventListener('click', function() {
                const id = document.getElementById('partialUpdateId').value;
                const address = document.getElementById('partialAddress').value;
                const neighborhood = document.getElementById('partialNeighborhood').value || null;
                const financeAmount = document.getElementById('partialFinanceAmount').value;
                const agreementDescription = document.getElementById('partialAgreementDescription').value || null;
                
                // Validaciones
                if (!address) {
                    showMessage('Por favor, ingrese una dirección para el acuerdo de pago', 'warning');
                    return;
                }
                
                if (isNaN(parseFloat(financeAmount)) || parseFloat(financeAmount) <= 0) {
                    showMessage('Por favor, ingrese un monto a financiar válido', 'warning');
                    return;
                }
                
                updatePartial(id, address, neighborhood, financeAmount, agreementDescription);
            });
        });