const API_URL = 'https://localhost:7182/api/Module';
        
// Elementos DOM
const moduleTableBody = document.getElementById('moduleTableBody');
const statusMessage = document.getElementById('statusMessage');
const loadDataBtn = document.getElementById('loadDataBtn');
const testAPIBtn = document.getElementById('testAPIBtn');
const addModuleBtn = document.getElementById('addModuleBtn');
const saveModuleBtn = document.getElementById('saveModuleBtn');
const updateModuleBtn = document.getElementById('updateModuleBtn');
const saveBasicInfoBtn = document.getElementById('saveBasicInfoBtn');

// Referencias a modales para Bootstrap 5
let addModuleModal;
let editModuleModal;
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

// Obtener clase para el badge de estado según el valor
function getStatusBadgeClass(status) {
    if (!status) return 'status-draft';
    
    switch(status.toLowerCase()) {
        case 'activo':
            return 'status-active';
        case 'inactivo':
            return 'status-inactive';
        case 'en desarrollo':
            return 'status-draft';
        case 'suspendido':
            return 'status-inactive';
        default:
            return 'status-draft';
    }
}

// Cargar módulos desde la API
function loadModules() {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando módulos...', 'info');
    
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
                moduleTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay módulos disponibles</td></tr>';
                showMessage('No hay módulos disponibles en el sistema', 'warning');
                return;
            }
            
            // Asegurarse de que data sea un array
            const modules = Array.isArray(data) ? data : [data];
            
            // Construir la tabla
            let html = '';
            modules.forEach(module => {
                html += `
                    <tr>
                        <td>${module.id}</td>
                        <td>${module.name}</td>
                        <td class="description-cell" title="${module.description || ''}">${module.description || 'Sin descripción'}</td>
                        <td>
                            <span class="badge status-badge ${getStatusBadgeClass(module.statu)}">
                                ${module.statu || 'Sin definir'}
                            </span>
                        </td>
                        <td>
                            <span class="badge ${module.isActive ? 'bg-success' : 'bg-secondary'}">
                                ${module.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-warning edit-btn" data-id="${module.id}" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-info update-basic-btn" data-id="${module.id}" title="Actualizar Info Básica">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                                <button class="btn btn-sm btn-danger delete-btn" data-id="${module.id}" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button class="btn btn-sm ${module.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                        data-id="${module.id}" data-active="${module.isActive}" title="${module.isActive ? 'Desactivar' : 'Activar'}">
                                    <i class="fas fa-${module.isActive ? 'times' : 'check'}"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            moduleTableBody.innerHTML = html;
            showMessage(`${modules.length} módulos cargados correctamente`, 'success');
            
            // Agregar event listeners a los botones
            addButtonEventListeners();
        })
        .catch(error => {
            console.error('Error cargando módulos:', error);
            moduleTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">
                <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
            </td></tr>`;
            showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar módulos: ${error.message}`, 'danger');
        });
}

// Añadir event listeners a los botones en la tabla
function addButtonEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const moduleId = this.getAttribute('data-id');
            getModuleById(moduleId);
        });
    });
    
    document.querySelectorAll('.update-basic-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const moduleId = this.getAttribute('data-id');
            getModuleForBasicUpdate(moduleId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const moduleId = this.getAttribute('data-id');
            deleteModule(moduleId);
        });
    });
    
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const moduleId = this.getAttribute('data-id');
            const currentStatus = this.getAttribute('data-active') === 'true';
            toggleModuleStatus(moduleId, !currentStatus);
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

// Crear módulo
function createModule(moduleData) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Creando módulo...', 'info');
    
    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(moduleData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showMessage('<i class="fas fa-check-circle"></i> Módulo creado correctamente', 'success');
        loadModules(); // Recargar la tabla
        addModuleModal.hide();
        document.getElementById('addModuleForm').reset();
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al crear módulo: ${error.message}`, 'danger');
    });
}

// Eliminar módulo
function deleteModule(id) {
    if (!confirm('¿Está seguro de eliminar este módulo?')) return;
    
    showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando módulo...', 'info');
    
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
        showMessage('<i class="fas fa-check-circle"></i> Módulo eliminado correctamente', 'success');
        loadModules(); // Recargar la tabla
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar módulo: ${error.message}`, 'danger');
    });
}

// Cambiar estado de módulo
function toggleModuleStatus(id, newStatus) {
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
        loadModules(); // Recargar la tabla
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
    });
}

// Obtener módulo por ID
function getModuleById(id) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del módulo...', 'info');
    
    fetch(`${API_URL}/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error de servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(module => {
            // Llenar formulario
            document.getElementById('editModuleId').value = module.id;
            document.getElementById('editName').value = module.name;
            document.getElementById('editDescription').value = module.description || '';
            document.getElementById('editStatu').value = module.statu || 'Activo';
            document.getElementById('editIsActive').checked = module.isActive;
            
            editModuleModal.show();
            statusMessage.style.display = 'none';
        })
        .catch(error => {
            showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del módulo: ${error.message}`, 'danger');
        });
}

// Obtener módulo para actualización básica
function getModuleForBasicUpdate(id) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del módulo...', 'info');
    
    fetch(`${API_URL}/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error de servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(module => {
            // Llenar formulario
            document.getElementById('basicInfoId').value = module.id;
            document.getElementById('basicInfoName').value = module.name;
            document.getElementById('basicInfoDescription').value = module.description || '';
            document.getElementById('basicInfoStatu').value = module.statu || 'Activo';
            
            updateBasicInfoModal.show();
            statusMessage.style.display = 'none';
        })
        .catch(error => {
            showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del módulo: ${error.message}`, 'danger');
        });
}

// Actualizar módulo
function updateModule(id, moduleData) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando módulo...', 'info');
    
    fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(moduleData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showMessage('<i class="fas fa-check-circle"></i> Módulo actualizado correctamente', 'success');
        loadModules(); // Recargar la tabla
        editModuleModal.hide();
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar módulo: ${error.message}`, 'danger');
    });
}

// Actualizar información básica del módulo
function updateBasicInfo(id, name, description, statu) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando información básica...', 'info');
    
    const moduleData = {
        id: parseInt(id),
        name: name,
        description: description,
        statu: statu
    };
    
    fetch(`${API_URL}/${id}/Update-Name-Description-Statu`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(moduleData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showMessage('<i class="fas fa-check-circle"></i> Información básica actualizada correctamente', 'success');
        loadModules(); // Recargar la tabla
        updateBasicInfoModal.hide();
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar información básica: ${error.message}`, 'danger');
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar modales de Bootstrap 5
    addModuleModal = new bootstrap.Modal(document.getElementById('addModuleModal'));
    editModuleModal = new bootstrap.Modal(document.getElementById('editModuleModal'));
    updateBasicInfoModal = new bootstrap.Modal(document.getElementById('updateBasicInfoModal'));
    
    // Cargar datos al iniciar
    loadModules();
    
    // Event listeners para botones
    loadDataBtn.addEventListener('click', loadModules);
    testAPIBtn.addEventListener('click', testAPI);
    
    addModuleBtn.addEventListener('click', function() {
        document.getElementById('addModuleForm').reset();
        addModuleModal.show();
    });
    
    saveModuleBtn.addEventListener('click', function() {
        const moduleData = {
            name: document.getElementById('name').value,
            description: document.getElementById('description').value || null,
            statu: document.getElementById('statu').value,
            isActive: document.getElementById('isActive').checked
        };
        
        // Validaciones
        if (!moduleData.name) {
            showMessage('Por favor, ingrese un nombre para el módulo', 'warning');
            return;
        }
        
        createModule(moduleData);
    });
    
    updateModuleBtn.addEventListener('click', function() {
        const id = document.getElementById('editModuleId').value;
        const moduleData = {
            id: parseInt(id),
            name: document.getElementById('editName').value,
            description: document.getElementById('editDescription').value || null,
            statu: document.getElementById('editStatu').value,
            isActive: document.getElementById('editIsActive').checked
        };
        
        // Validaciones
        if (!moduleData.name) {
            showMessage('Por favor, ingrese un nombre para el módulo', 'warning');
            return;
        }
        
        updateModule(id, moduleData);
    });
    
    saveBasicInfoBtn.addEventListener('click', function() {
        const id = document.getElementById('basicInfoId').value;
        const name = document.getElementById('basicInfoName').value;
        const description = document.getElementById('basicInfoDescription').value || null;
        const statu = document.getElementById('basicInfoStatu').value;
        
        // Validaciones
        if (!name) {
            showMessage('Por favor, ingrese un nombre para el módulo', 'warning');
            return;
        }
        
        updateBasicInfo(id, name, description, statu);
    });
});