const API_URL = 'https://localhost:7182/api/StateInfraction';
        const PERSON_API_URL = 'https://localhost:7182/api/Person';
        const INFRACTION_TYPE_API_URL = 'https://localhost:7182/api/TypeInfraction';
        
        // Elementos DOM
        const infractionTableBody = document.getElementById('infractionTableBody');
        const statusMessage = document.getElementById('statusMessage');
        const loadDataBtn = document.getElementById('loadDataBtn');
        const testAPIBtn = document.getElementById('testAPIBtn');
        const addInfractionBtn = document.getElementById('addInfractionBtn');
        const saveInfractionBtn = document.getElementById('saveInfractionBtn');
        const updateInfractionBtn = document.getElementById('updateInfractionBtn');
        const saveFineStateBtn = document.getElementById('saveFineStateBtn');
        
        // Referencias a modales para Bootstrap 5
        let addInfractionModal;
        let editInfractionModal;
        let updateFineStateModal;
        
        // Cache de datos
        let personList = [];
        let infractionTypeList = [];
        
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
        
        // Formatear fecha para visualización
        function formatDate(dateString) {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleString();
        }
        
        // Formatear fecha para input datetime-local
        function formatDateForInput(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            
            // Formato YYYY-MM-DDThh:mm para input datetime-local
            const yyyy = date.getFullYear();
            const MM = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const hh = String(date.getHours()).padStart(2, '0');
            const mm = String(date.getMinutes()).padStart(2, '0');
            
            return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
        }
        
        // Formatear valor monetario
        function formatCurrency(value) {
            if (value === undefined || value === null) return '$0.00';
            return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
        }
        
        // Obtener clase para el badge de estado según el valor
        function getStateBadgeClass(state) {
            if (!state) return 'state-pending';
            
            switch(state.toLowerCase()) {
                case 'pagado':
                    return 'state-paid';
                case 'apelado':
                    return 'state-appealed';
                case 'vencido':
                    return 'state-overdue';
                default:
                    return 'state-pending';
            }
        }
        
        // Cargar personas para los selectores
        async function loadPersons() {
            try {
                const response = await fetch(PERSON_API_URL);
                if (!response.ok) {
                    throw new Error(`Error al cargar personas: ${response.status}`);
                }
                
                personList = await response.json();
                
                // Llenar selectores de personas
                const personSelectors = ['personId', 'editPersonId'];
                personSelectors.forEach(id => {
                    const selector = document.getElementById(id);
                    if (selector) {
                        // Mantener la opción predeterminada
                        const defaultOption = selector.options[0];
                        selector.innerHTML = '';
                        selector.appendChild(defaultOption);
                        
                        // Añadir opciones de personas
                        personList.forEach(person => {
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
                showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar personas: ${error.message}`, 'danger');
                return false;
            }
        }
        
        // Cargar tipos de infracciones para los selectores
        async function loadInfractionTypes() {
            try {
                const response = await fetch(INFRACTION_TYPE_API_URL);
                if (!response.ok) {
                    throw new Error(`Error al cargar tipos de infracciones: ${response.status}`);
                }
                
                infractionTypeList = await response.json();
                
                // Llenar selectores de tipos de infracciones
                const typeSelectors = ['infractionId', 'editInfractionTypeId'];
                typeSelectors.forEach(id => {
                    const selector = document.getElementById(id);
                    if (selector) {
                        // Mantener la opción predeterminada
                        const defaultOption = selector.options[0];
                        selector.innerHTML = '';
                        selector.appendChild(defaultOption);
                        
                        // Añadir opciones de tipos de infracciones
                        infractionTypeList.forEach(type => {
                            const option = document.createElement('option');
                            option.value = type.id;
                            option.textContent = type.name;
                            selector.appendChild(option);
                        });
                    }
                });
                
                return true;
            } catch (error) {
                console.error('Error al cargar tipos de infracciones:', error);
                showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar tipos de infracciones: ${error.message}`, 'danger');
                return false;
            }
        }
        
        // Obtener nombre de persona por ID
        function getPersonName(personId) {
            const person = personList.find(p => p.id === personId);
            return person ? `${person.firstName} ${person.lastName}` : `Persona ID: ${personId}`;
        }
        
        // Obtener nombre de tipo de infracción por ID
        function getInfractionTypeName(typeId) {
            const type = infractionTypeList.find(t => t.id === typeId);
            return type ? type.name : `Tipo de Infracción ID: ${typeId}`;
        }
        
        // Cargar infracciones desde la API
        async function loadInfractions() {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando infracciones...', 'info');
            
            try {
                // Cargar datos relacionados primero
                await Promise.all([loadPersons(), loadInfractionTypes()]);
                
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error(`Error de servidor: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Datos recibidos:', data);
                
                if (!data || (Array.isArray(data) && data.length === 0)) {
                    infractionTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No hay infracciones disponibles</td></tr>';
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
                            <td>${getPersonName(infraction.personId)}</td>
                            <td>${getInfractionTypeName(infraction.infractionId)}</td>
                            <td>${formatDate(infraction.dateViolation)}</td>
                            <td>${formatCurrency(infraction.fineValue)}</td>
                            <td>
                                <span class="badge state-badge ${getStateBadgeClass(infraction.state)}">
                                    ${infraction.state || 'Pendiente'}
                                </span>
                            </td>
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
                                    <button class="btn btn-sm btn-info update-fine-state-btn" data-id="${infraction.id}" title="Actualizar Multa/Estado">
                                        <i class="fas fa-money-bill-wave"></i>
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
                
            } catch (error) {
                console.error('Error cargando infracciones:', error);
                infractionTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
                </td></tr>`;
                showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar infracciones: ${error.message}`, 'danger');
            }
        }
        
        // Añadir event listeners a los botones en la tabla
        function addButtonEventListeners() {
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const infractionId = this.getAttribute('data-id');
                    getInfractionById(infractionId);
                });
            });
            
            document.querySelectorAll('.update-fine-state-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const infractionId = this.getAttribute('data-id');
                    getInfractionForFineStateUpdate(infractionId);
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
        
        // Cambiar estado activo de infracción
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
                    document.getElementById('editPersonId').value = infraction.personId;
                    document.getElementById('editInfractionTypeId').value = infraction.infractionId;
                    document.getElementById('editDateViolation').value = formatDateForInput(infraction.dateViolation);
                    document.getElementById('editFineValue').value = infraction.fineValue;
                    document.getElementById('editState').value = infraction.state;
                    document.getElementById('editIsActive').checked = infraction.isActive;
                    document.getElementById('editCreatedAt').value = formatDate(infraction.createdAt);
                    
                    editInfractionModal.show();
                    statusMessage.style.display = 'none';
                })
                .catch(error => {
                    showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos de la infracción: ${error.message}`, 'danger');
                });
        }
        
        // Obtener infracción para actualizar multa y estado
        function getInfractionForFineStateUpdate(id) {
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
                    document.getElementById('fineStateInfractionId').value = infraction.id;
                    document.getElementById('fineStateValue').value = infraction.fineValue;
                    document.getElementById('fineStateState').value = infraction.state;
                    
                    // Mostrar detalles de la infracción
                    document.getElementById('infractionDetailsLabel').textContent = `
                        Persona: ${getPersonName(infraction.personId)} | 
                        Tipo: ${getInfractionTypeName(infraction.infractionId)} | 
                        Fecha: ${formatDate(infraction.dateViolation)}
                    `;
                    
                    updateFineStateModal.show();
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
        
        // Actualizar solo multa y estado de la infracción
        function updateFineState(id, fineValue, state) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando multa y estado...', 'info');
            
            const data = {
                id: parseInt(id),
                fineValue: parseFloat(fineValue),
                state: state
            };
            
            fetch(`${API_URL}/${id}/FineValue-State`, {
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
                showMessage('<i class="fas fa-check-circle"></i> Multa y estado actualizados correctamente', 'success');
                loadInfractions(); // Recargar la tabla
                updateFineStateModal.hide();
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar multa y estado: ${error.message}`, 'danger');
            });
        }
        
        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Inicializar modales de Bootstrap 5
            addInfractionModal = new bootstrap.Modal(document.getElementById('addInfractionModal'));
            editInfractionModal = new bootstrap.Modal(document.getElementById('editInfractionModal'));
            updateFineStateModal = new bootstrap.Modal(document.getElementById('updateFineStateModal'));
            
            // Cargar datos al iniciar
            loadInfractions();
            
            // Event listeners para botones
            loadDataBtn.addEventListener('click', loadInfractions);
            testAPIBtn.addEventListener('click', testAPI);
            
            addInfractionBtn.addEventListener('click', function() {
                Promise.all([loadPersons(), loadInfractionTypes()]).then(() => {
                    document.getElementById('addInfractionForm').reset();
                    // Establecer fecha de violación actual por defecto
                    const now = new Date();
                    document.getElementById('dateViolation').value = formatDateForInput(now);
                    addInfractionModal.show();
                });
            });
            
            saveInfractionBtn.addEventListener('click', function() {
                const formData = {
                    personId: parseInt(document.getElementById('personId').value),
                    infractionId: parseInt(document.getElementById('infractionId').value),
                    dateViolation: document.getElementById('dateViolation').value,
                    fineValue: parseFloat(document.getElementById('fineValue').value),
                    state: document.getElementById('state').value,
                    isActive: document.getElementById('isActive').checked
                };
                
                // Validaciones
                if (!formData.personId) {
                    showMessage('Por favor, seleccione una persona', 'warning');
                    return;
                }
                if (!formData.infractionId) {
                    showMessage('Por favor, seleccione un tipo de infracción', 'warning');
                    return;
                }
                if (!formData.dateViolation) {
                    showMessage('Por favor, ingrese una fecha de violación', 'warning');
                    return;
                }
                if (isNaN(formData.fineValue) || formData.fineValue <= 0) {
                    showMessage('Por favor, ingrese un valor de multa válido', 'warning');
                    return;
                }
                
                createInfraction(formData);
            });
            
            updateInfractionBtn.addEventListener('click', function() {
                const id = document.getElementById('editInfractionId').value;
                const formData = {
                    id: parseInt(id),
                    personId: parseInt(document.getElementById('editPersonId').value),
                    infractionId: parseInt(document.getElementById('editInfractionTypeId').value),
                    dateViolation: document.getElementById('editDateViolation').value,
                    fineValue: parseFloat(document.getElementById('editFineValue').value),
                    state: document.getElementById('editState').value,
                    isActive: document.getElementById('editIsActive').checked
                };
                
                // Validaciones similares a las de creación
                if (!formData.personId) {
                    showMessage('Por favor, seleccione una persona', 'warning');
                    return;
                }
                if (!formData.infractionId) {
                    showMessage('Por favor, seleccione un tipo de infracción', 'warning');
                    return;
                }
                if (!formData.dateViolation) {
                    showMessage('Por favor, ingrese una fecha de violación', 'warning');
                    return;
                }
                if (isNaN(formData.fineValue) || formData.fineValue <= 0) {
                    showMessage('Por favor, ingrese un valor de multa válido', 'warning');
                    return;
                }
                
                updateInfraction(id, formData);
            });
            
            saveFineStateBtn.addEventListener('click', function() {
                const id = document.getElementById('fineStateInfractionId').value;
                const fineValue = document.getElementById('fineStateValue').value;
                const state = document.getElementById('fineStateState').value;
                
                // Validaciones
                if (isNaN(fineValue) || parseFloat(fineValue) <= 0) {
                    showMessage('Por favor, ingrese un valor de multa válido', 'warning');
                    return;
                }
                
                updateFineState(id, fineValue, state);
            });
        });