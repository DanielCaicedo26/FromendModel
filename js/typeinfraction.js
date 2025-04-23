const API_URL = 'https://localhost:7182/api/TypeInfraction';
const USER_API_URL = 'https://localhost:7182/api/User';

// Elementos DOM
const typeInfractionTableBody = document.getElementById('typeInfractionTableBody');
const statusMessage = document.getElementById('statusMessage');
const loadDataBtn = document.getElementById('loadDataBtn');
const testAPIBtn = document.getElementById('testAPIBtn');
const addTypeInfractionBtn = document.getElementById('addTypeInfractionBtn');
const saveTypeInfractionBtn = document.getElementById('saveTypeInfractionBtn');
const updateTypeInfractionBtn = document.getElementById('updateTypeInfractionBtn');
const savePartialBtn = document.getElementById('savePartialBtn');

// Referencias a modales para Bootstrap 5
let addTypeInfractionModal;
let editTypeInfractionModal;
let updatePartialModal;

// Cache de datos
let users = [];

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

// Formatear valor monetario
function formatCurrency(value) {
    if (value === undefined || value === null) return '$0.00';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

// Cargar usuarios para los selectores
async function loadUsers() {
    try {
        const response = await fetch(USER_API_URL);
        if (!response.ok) {
            throw new Error(`Error al cargar usuarios: ${response.status}`);
        }
        
        users = await response.json();
        
        // Llenar los selectores de usuarios
        const userSelectors = [
            document.getElementById('userId'),
            document.getElementById('editUserId')
        ];
        
        userSelectors.forEach(selector => {
            if (!selector) return;
            
            // Mantener la opción predeterminada
            const defaultOption = selector.options[0];
            selector.innerHTML = '';
            selector.appendChild(defaultOption);
            
            // Agregar opciones de usuarios
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.username} (${user.email})`;
                selector.appendChild(option);
            });
        });
        
        return true;
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar usuarios: ${error.message}`, 'danger');
        return false;
    }
}

// Obtener nombre de usuario por ID
function getUsernameById(userId) {
    const user = users.find(u => u.id === userId);
    return user ? `${user.username} (${user.email})` : `Usuario ID: ${userId}`;
}

// Cargar tipos de infracciones desde la API
async function loadTypeInfractions() {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando tipos de infracciones...', 'info');
    
    try {
        // Primero cargar usuarios para las referencias
        await loadUsers();
        
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        if (!data || (Array.isArray(data) && data.length === 0)) {
            typeInfractionTableBody.innerHTML = '<tr><td colspan="9" class="text-center">No hay tipos de infracciones disponibles</td></tr>';
            showMessage('No hay tipos de infracciones disponibles en el sistema', 'warning');
            return;
        }
        
        // Asegurarse de que data sea un array
        const typeInfractions = Array.isArray(data) ? data : [data];
        
        // Construir la tabla
        let html = '';
        typeInfractions.forEach(ti => {
            html += `
                <tr>
                    <td>${ti.id}</td>
                    <td>${ti.typeViolation}</td>
                    <td>${getUsernameById(ti.userId)}</td>
                    <td class="value-cell">${formatCurrency(ti.valueInfraction)}</td>
                    <td class="description-cell" title="${ti.description || ''}">${ti.description || 'Sin descripción'}</td>
                    <td class="description-cell" title="${ti.informationFine || ''}">${ti.informationFine || 'Sin información'}</td>
                    <td>${formatDate(ti.createdAt)}</td>
                    <td>
                        <span class="badge ${ti.isActive ? 'bg-success' : 'bg-secondary'}">
                            ${ti.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-warning edit-btn" data-id="${ti.id}" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-info update-partial-btn" data-id="${ti.id}" title="Actualizar Tipo y Valor">
                                <i class="fas fa-dollar-sign"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${ti.id}" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button class="btn btn-sm ${ti.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                    data-id="${ti.id}" data-active="${ti.isActive}" title="${ti.isActive ? 'Desactivar' : 'Activar'}">
                                <i class="fas fa-${ti.isActive ? 'times' : 'check'}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        typeInfractionTableBody.innerHTML = html;
        showMessage(`${typeInfractions.length} tipos de infracciones cargados correctamente`, 'success');
        
        // Agregar event listeners a los botones
        addButtonEventListeners();
    } catch (error) {
        console.error('Error cargando tipos de infracciones:', error);
        typeInfractionTableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">
            <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
        </td></tr>`;
        showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar tipos de infracciones: ${error.message}`, 'danger');
    }
}

// Añadir event listeners a los botones en la tabla
function addButtonEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            getTypeInfractionById(id);
        });
    });
    
    document.querySelectorAll('.update-partial-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            getTypeInfractionForPartialUpdate(id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            deleteTypeInfraction(id);
        });
    });
    
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const currentStatus = this.getAttribute('data-active') === 'true';
            toggleTypeInfractionStatus(id, !currentStatus);
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

// Crear tipo de infracción
function createTypeInfraction(data) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Creando tipo de infracción...', 'info');
    
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
        showMessage('<i class="fas fa-check-circle"></i> Tipo de infracción creado correctamente', 'success');
        loadTypeInfractions(); // Recargar la tabla
        addTypeInfractionModal.hide();
        document.getElementById('addTypeInfractionForm').reset();
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al crear tipo de infracción: ${error.message}`, 'danger');
    });
}

// Eliminar tipo de infracción
function deleteTypeInfraction(id) {
    if (!confirm('¿Está seguro de eliminar este tipo de infracción?')) return;
    
    showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando tipo de infracción...', 'info');
    
    fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        
        showMessage('<i class="fas fa-check-circle"></i> Tipo de infracción eliminado correctamente', 'success');
        loadTypeInfractions(); // Recargar la tabla
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar tipo de infracción: ${error.message}`, 'danger');
    });
}

// Cambiar estado de tipo de infracción
function toggleTypeInfractionStatus(id, newStatus) {
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
        loadTypeInfractions(); // Recargar la tabla
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
    });
}

// Obtener tipo de infracción por ID
function getTypeInfractionById(id) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del tipo de infracción...', 'info');
    
    fetch(`${API_URL}/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error de servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(ti => {
            // Llenar formulario
            document.getElementById('editTypeInfractionId').value = ti.id;
            document.getElementById('editTypeViolation').value = ti.typeViolation;
            document.getElementById('editUserId').value = ti.userId;
            document.getElementById('editValueInfraction').value = ti.valueInfraction;
            document.getElementById('editDescription').value = ti.description || '';
            document.getElementById('editInformationFine').value = ti.informationFine || '';
            document.getElementById('editIsActive').checked = ti.isActive;
            document.getElementById('editCreatedAt').value = formatDate(ti.createdAt);
            
            editTypeInfractionModal.show();
            statusMessage.style.display = 'none';
        })
        .catch(error => {
            showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del tipo de infracción: ${error.message}`, 'danger');
        });
}

// Obtener tipo de infracción para actualización parcial
function getTypeInfractionForPartialUpdate(id) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del tipo de infracción...', 'info');
    
    fetch(`${API_URL}/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error de servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(ti => {
            // Llenar formulario
            document.getElementById('partialTypeInfractionId').value = ti.id;
            document.getElementById('partialTypeViolation').value = ti.typeViolation;
            document.getElementById('partialValueInfraction').value = ti.valueInfraction;
            
            updatePartialModal.show();
            statusMessage.style.display = 'none';
        })
        .catch(error => {
            showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del tipo de infracción: ${error.message}`, 'danger');
        });
}

// Actualizar tipo de infracción
function updateTypeInfraction(id, data) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando tipo de infracción...', 'info');
    
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
        showMessage('<i class="fas fa-check-circle"></i> Tipo de infracción actualizado correctamente', 'success');
        loadTypeInfractions(); // Recargar la tabla
        editTypeInfractionModal.hide();
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar tipo de infracción: ${error.message}`, 'danger');
    });
}

// Actualizar parcialmente el tipo de infracción (tipo de violación y valor)
function updatePartial(id, typeViolation, valueInfraction) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando tipo y valor...', 'info');
    
    const data = {
        id: parseInt(id),
        typeViolation: typeViolation,
        valueInfraction: parseFloat(valueInfraction)
    };
    
    fetch(`${API_URL}/${id}/TypeViolation-ValueInfraction`, {
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
        showMessage('<i class="fas fa-check-circle"></i> Tipo y valor actualizados correctamente', 'success');
        loadTypeInfractions(); // Recargar la tabla
        updatePartialModal.hide();
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar tipo y valor: ${error.message}`, 'danger');
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar modales de Bootstrap 5
    addTypeInfractionModal = new bootstrap.Modal(document.getElementById('addTypeInfractionModal'));
    editTypeInfractionModal = new bootstrap.Modal(document.getElementById('editTypeInfractionModal'));
    updatePartialModal = new bootstrap.Modal(document.getElementById('updatePartialModal'));
    
    // Cargar datos al iniciar
    loadTypeInfractions();
    
    // Event listeners para botones
    loadDataBtn.addEventListener('click', loadTypeInfractions);
    testAPIBtn.addEventListener('click', testAPI);
    
    addTypeInfractionBtn.addEventListener('click', function() {
        loadUsers().then(() => {
            document.getElementById('addTypeInfractionForm').reset();
            addTypeInfractionModal.show();
        });
    });
    
    saveTypeInfractionBtn.addEventListener('click', function() {
        const data = {
            typeViolation: document.getElementById('typeViolation').value,
            userId: parseInt(document.getElementById('userId').value),
            valueInfraction: parseFloat(document.getElementById('valueInfraction').value),
            description: document.getElementById('description').value || null,
            informationFine: document.getElementById('informationFine').value || null,
            isActive: document.getElementById('isActive').checked
        };
        
        // Validaciones
        if (!data.typeViolation) {
            showMessage('Por favor, ingrese un tipo de violación', 'warning');
            return;
        }
        if (!data.userId) {
            showMessage('Por favor, seleccione un usuario', 'warning');
            return;
        }
        if (isNaN(data.valueInfraction) || data.valueInfraction < 0) {
            showMessage('Por favor, ingrese un valor válido para la infracción', 'warning');
            return;
        }
        
        createTypeInfraction(data);
    });
    
    updateTypeInfractionBtn.addEventListener('click', function() {
        const id = document.getElementById('editTypeInfractionId').value;
        const data = {
            id: parseInt(id),
            typeViolation: document.getElementById('editTypeViolation').value,
            userId: parseInt(document.getElementById('editUserId').value),
            valueInfraction: parseFloat(document.getElementById('editValueInfraction').value),
            description: document.getElementById('editDescription').value || null,
            informationFine: document.getElementById('editInformationFine').value || null,
            isActive: document.getElementById('editIsActive').checked
        };
        
        // Validaciones
        if (!data.typeViolation) {
            showMessage('Por favor, ingrese un tipo de violación', 'warning');
            return;
        }
        if (!data.userId) {
            showMessage('Por favor, seleccione un usuario', 'warning');
            return;
        }
        if (isNaN(data.valueInfraction) || data.valueInfraction < 0) {
            showMessage('Por favor, ingrese un valor válido para la infracción', 'warning');
            return;
        }
        
        updateTypeInfraction(id, data);
    });
    
    savePartialBtn.addEventListener('click', function() {
        const id = document.getElementById('partialTypeInfractionId').value;
        const typeViolation = document.getElementById('partialTypeViolation').value;
        const valueInfraction = document.getElementById('partialValueInfraction').value;
        
        // Validaciones
        if (!typeViolation) {
            showMessage('Por favor, ingrese un tipo de violación', 'warning');
            return;
        }
        if (isNaN(parseFloat(valueInfraction)) || parseFloat(valueInfraction) < 0) {
            showMessage('Por favor, ingrese un valor válido para la infracción', 'warning');
            return;
        }
        
        updatePartial(id, typeViolation, valueInfraction);
    });
});