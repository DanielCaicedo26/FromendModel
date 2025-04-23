const API_URL = 'https://localhost:7182/api/TypePayment';
        
        // Elementos DOM
        const typePaymentTableBody = document.getElementById('typePaymentTableBody');
        const statusMessage = document.getElementById('statusMessage');
        const loadDataBtn = document.getElementById('loadDataBtn');
        const testAPIBtn = document.getElementById('testAPIBtn');
        const addTypePaymentBtn = document.getElementById('addTypePaymentBtn');
        const saveTypePaymentBtn = document.getElementById('saveTypePaymentBtn');
        const updateTypePaymentBtn = document.getElementById('updateTypePaymentBtn');
        const saveNameDescBtn = document.getElementById('saveNameDescBtn');
        
        // Referencias a modales para Bootstrap 5
        let addTypePaymentModal;
        let editTypePaymentModal;
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
        
        // Cargar tipos de pago desde la API
        function loadTypePayments() {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando tipos de pago...', 'info');
            
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
                        typePaymentTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay tipos de pago disponibles</td></tr>';
                        showMessage('No hay tipos de pago disponibles en el sistema', 'warning');
                        return;
                    }
                    
                    // Asegurarse de que data sea un array
                    const typePayments = Array.isArray(data) ? data : [data];
                    
                    // Construir la tabla
                    let html = '';
                    typePayments.forEach(typePayment => {
                        html += `
                            <tr>
                                <td>${typePayment.id}</td>
                                <td>${typePayment.name}</td>
                                <td class="description-cell" title="${typePayment.description || ''}">${typePayment.description || 'Sin descripción'}</td>
                                <td>
                                    <span class="badge ${typePayment.isActive ? 'bg-success' : 'bg-secondary'}">
                                        ${typePayment.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td>
                                    <div class="btn-group" role="group">
                                        <button class="btn btn-sm btn-warning edit-btn" data-id="${typePayment.id}" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-info update-name-desc-btn" data-id="${typePayment.id}" title="Actualizar Nombre/Descripción">
                                            <i class="fas fa-font"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger delete-btn" data-id="${typePayment.id}" title="Eliminar">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                        <button class="btn btn-sm ${typePayment.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                                data-id="${typePayment.id}" data-active="${typePayment.isActive}" title="${typePayment.isActive ? 'Desactivar' : 'Activar'}">
                                            <i class="fas fa-${typePayment.isActive ? 'times' : 'check'}"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                    
                    typePaymentTableBody.innerHTML = html;
                    showMessage(`${typePayments.length} tipos de pago cargados correctamente`, 'success');
                    
                    // Agregar event listeners a los botones
                    addButtonEventListeners();
                })
                .catch(error => {
                    console.error('Error cargando tipos de pago:', error);
                    typePaymentTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">
                        <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
                    </td></tr>`;
                    showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar tipos de pago: ${error.message}`, 'danger');
                });
        }
        
        // Añadir event listeners a los botones en la tabla
        function addButtonEventListeners() {
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const typePaymentId = this.getAttribute('data-id');
                    getTypePaymentById(typePaymentId);
                });
            });
            
            document.querySelectorAll('.update-name-desc-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const typePaymentId = this.getAttribute('data-id');
                    getTypePaymentForNameDescUpdate(typePaymentId);
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const typePaymentId = this.getAttribute('data-id');
                    deleteTypePayment(typePaymentId);
                });
            });
            
            document.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const typePaymentId = this.getAttribute('data-id');
                    const currentStatus = this.getAttribute('data-active') === 'true';
                    toggleTypePaymentStatus(typePaymentId, !currentStatus);
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
        
        // Crear tipo de pago
        function createTypePayment(typePaymentData) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Creando tipo de pago...', 'info');
            
            fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(typePaymentData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error de servidor: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                showMessage('<i class="fas fa-check-circle"></i> Tipo de pago creado correctamente', 'success');
                loadTypePayments(); // Recargar la tabla
                addTypePaymentModal.hide();
                document.getElementById('addTypePaymentForm').reset();
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al crear tipo de pago: ${error.message}`, 'danger');
            });
        }
        
        // Eliminar tipo de pago
        function deleteTypePayment(id) {
            if (!confirm('¿Está seguro de eliminar este tipo de pago?')) return;
            
            showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando tipo de pago...', 'info');
            
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
                showMessage('<i class="fas fa-check-circle"></i> Tipo de pago eliminado correctamente', 'success');
                loadTypePayments(); // Recargar la tabla
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar tipo de pago: ${error.message}`, 'danger');
            });
        }
        
        // Cambiar estado de tipo de pago
        function toggleTypePaymentStatus(id, newStatus) {
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
                loadTypePayments(); // Recargar la tabla
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
            });
        }
        
        // Obtener tipo de pago por ID
        function getTypePaymentById(id) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del tipo de pago...', 'info');
            
            fetch(`${API_URL}/${id}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error de servidor: ${response.status}`);
                    }
                    return response.json();
                })
                .then(typePayment => {
                    // Llenar formulario
                    document.getElementById('editTypePaymentId').value = typePayment.id;
                    document.getElementById('editName').value = typePayment.name;
                    document.getElementById('editDescription').value = typePayment.description || '';
                    document.getElementById('editIsActive').checked = typePayment.isActive;
                    
                    editTypePaymentModal.show();
                    statusMessage.style.display = 'none';
                })
                .catch(error => {
                    showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del tipo de pago: ${error.message}`, 'danger');
                });
        }
        
        // Obtener tipo de pago para actualización parcial (nombre y descripción)
        function getTypePaymentForNameDescUpdate(id) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del tipo de pago...', 'info');
            
            fetch(`${API_URL}/${id}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error de servidor: ${response.status}`);
                    }
                    return response.json();
                })
                .then(typePayment => {
                    // Llenar formulario
                    document.getElementById('partialTypePaymentId').value = typePayment.id;
                    document.getElementById('partialName').value = typePayment.name;
                    document.getElementById('partialDescription').value = typePayment.description || '';
                    
                    updateNameDescModal.show();
                    statusMessage.style.display = 'none';
                })
                .catch(error => {
                    showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del tipo de pago: ${error.message}`, 'danger');
                });
        }
        
        // Actualizar tipo de pago
        function updateTypePayment(id, typePaymentData) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando tipo de pago...', 'info');
            
            fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(typePaymentData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error de servidor: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                showMessage('<i class="fas fa-check-circle"></i> Tipo de pago actualizado correctamente', 'success');
                loadTypePayments(); // Recargar la tabla
                editTypePaymentModal.hide();
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar tipo de pago: ${error.message}`, 'danger');
            });
        }
        
        // Actualizar parcialmente el tipo de pago (nombre y descripción)
        function updateNameDescription(id, name, description) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando nombre y descripción...', 'info');
            
            const typePaymentData = {
                id: parseInt(id),
                name: name,
                description: description
            };
            
            fetch(`${API_URL}/${id}/Name-Description`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(typePaymentData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error de servidor: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                showMessage('<i class="fas fa-check-circle"></i> Nombre y descripción actualizados correctamente', 'success');
                loadTypePayments(); // Recargar la tabla
                updateNameDescModal.hide();
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar nombre y descripción: ${error.message}`, 'danger');
            });
        }
        
        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Inicializar modales de Bootstrap 5
            addTypePaymentModal = new bootstrap.Modal(document.getElementById('addTypePaymentModal'));
            editTypePaymentModal = new bootstrap.Modal(document.getElementById('editTypePaymentModal'));
            updateNameDescModal = new bootstrap.Modal(document.getElementById('updateNameDescModal'));
            
            // Cargar datos al iniciar
            loadTypePayments();
            
            // Event listeners para botones
            loadDataBtn.addEventListener('click', loadTypePayments);
            testAPIBtn.addEventListener('click', testAPI);
            
            addTypePaymentBtn.addEventListener('click', function() {
                document.getElementById('addTypePaymentForm').reset();
                addTypePaymentModal.show();
            });
            
            saveTypePaymentBtn.addEventListener('click', function() {
                const typePaymentData = {
                    name: document.getElementById('name').value,
                    description: document.getElementById('description').value || null,
                    isActive: document.getElementById('isActive').checked
                };
                
                // Validaciones
                if (!typePaymentData.name) {
                    showMessage('Por favor, ingrese un nombre para el tipo de pago', 'warning');
                    return;
                }
                
                createTypePayment(typePaymentData);
            });
            
            updateTypePaymentBtn.addEventListener('click', function() {
                const id = document.getElementById('editTypePaymentId').value;
                const typePaymentData = {
                    id: parseInt(id),
                    name: document.getElementById('editName').value,
                    description: document.getElementById('editDescription').value || null,
                    isActive: document.getElementById('editIsActive').checked
                };
                
                // Validaciones
                if (!typePaymentData.name) {
                    showMessage('Por favor, ingrese un nombre para el tipo de pago', 'warning');
                    return;
                }
                
                updateTypePayment(id, typePaymentData);
            });
            
            saveNameDescBtn.addEventListener('click', function() {
                const id = document.getElementById('partialTypePaymentId').value;
                const name = document.getElementById('partialName').value;
                const description = document.getElementById('partialDescription').value || null;
                
                // Validaciones
                if (!name) {
                    showMessage('Por favor, ingrese un nombre para el tipo de pago', 'warning');
                    return;
                }
                
                updateNameDescription(id, name, description);
            });
        });