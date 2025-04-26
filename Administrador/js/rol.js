const API_URL = 'https://localhost:7182/api/Role';
        
        // Elementos DOM
        const roleTableBody = document.getElementById('roleTableBody');
        const statusMessage = document.getElementById('statusMessage');
        const loadDataBtn = document.getElementById('loadDataBtn');
        const testAPIBtn = document.getElementById('testAPIBtn');
        const addRoleBtn = document.getElementById('addRoleBtn');
        const saveRoleBtn = document.getElementById('saveRoleBtn');
        const updateRoleBtn = document.getElementById('updateRoleBtn');
        const saveNameBtn = document.getElementById('saveNameBtn');
        
        // Referencias a modales para Bootstrap 5
        let addRoleModal;
        let editRoleModal;
        let updateNameModal;
        
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
        
        // Cargar roles desde la API
        function loadRoles() {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando roles...', 'info');
            
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
                        roleTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay roles disponibles</td></tr>';
                        showMessage('No hay roles disponibles en el sistema', 'warning');
                        return;
                    }
                    
                    // Asegurarse de que data sea un array
                    const roles = Array.isArray(data) ? data : [data];
                    
                    // Construir la tabla
                    let html = '';
                    roles.forEach(role => {
                        html += `
                            <tr>
                                <td>${role.id}</td>
                                <td>${role.roleName}</td>
                                <td>
                                    <span class="badge ${role.isActive ? 'bg-success' : 'bg-secondary'}">
                                        ${role.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td>
                                    <div class="btn-group" role="group">
                                        <button class="btn btn-sm btn-warning edit-btn" data-id="${role.id}" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-info update-name-btn" data-id="${role.id}" title="Actualizar Nombre">
                                            <i class="fas fa-font"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger delete-btn" data-id="${role.id}" title="Eliminar">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                        <button class="btn btn-sm ${role.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                                data-id="${role.id}" data-active="${role.isActive}" title="${role.isActive ? 'Desactivar' : 'Activar'}">
                                            <i class="fas fa-${role.isActive ? 'times' : 'check'}"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                    
                    roleTableBody.innerHTML = html;
                    showMessage(`${roles.length} roles cargados correctamente`, 'success');
                    
                    // Agregar event listeners a los botones
                    addButtonEventListeners();
                })
                .catch(error => {
                    console.error('Error cargando roles:', error);
                    roleTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">
                        <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
                    </td></tr>`;
                    showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar roles: ${error.message}`, 'danger');
                });
        }
        
        // Añadir event listeners a los botones en la tabla
        function addButtonEventListeners() {
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const roleId = this.getAttribute('data-id');
                    getRoleById(roleId);
                });
            });
            
            document.querySelectorAll('.update-name-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const roleId = this.getAttribute('data-id');
                    getRoleNameForUpdate(roleId);
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const roleId = this.getAttribute('data-id');
                    deleteRole(roleId);
                });
            });
            
            document.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const roleId = this.getAttribute('data-id');
                    const currentStatus = this.getAttribute('data-active') === 'true';
                    toggleRoleStatus(roleId, !currentStatus);
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
        
        // Crear rol
        function createRole(roleData) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Creando rol...', 'info');
            
            fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(roleData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error de servidor: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                showMessage('<i class="fas fa-check-circle"></i> Rol creado correctamente', 'success');
                loadRoles(); // Recargar la tabla
                addRoleModal.hide();
                document.getElementById('addRoleForm').reset();
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al crear rol: ${error.message}`, 'danger');
            });
        }
        
        // Eliminar rol
        function deleteRole(id) {
            if (!confirm('¿Está seguro de eliminar este rol?')) return;
            
            showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando rol...', 'info');
            
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
                showMessage('<i class="fas fa-check-circle"></i> Rol eliminado correctamente', 'success');
                loadRoles(); // Recargar la tabla
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar rol: ${error.message}`, 'danger');
            });
        }
        
        // Cambiar estado de rol
        function toggleRoleStatus(id, newStatus) {
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
                loadRoles(); // Recargar la tabla
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
            });
        }
        
        // Obtener rol por ID
        function getRoleById(id) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del rol...', 'info');
            
            fetch(`${API_URL}/${id}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error de servidor: ${response.status}`);
                    }
                    return response.json();
                })
                .then(role => {
                    // Llenar formulario
                    document.getElementById('editRoleId').value = role.id;
                    document.getElementById('editRoleName').value = role.roleName;
                    document.getElementById('editIsActive').checked = role.isActive;
                    
                    editRoleModal.show();
                    statusMessage.style.display = 'none';
                })
                .catch(error => {
                    showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del rol: ${error.message}`, 'danger');
                });
        }
        
        // Obtener rol para actualizar solo el nombre
        function getRoleNameForUpdate(id) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos del rol...', 'info');
            
            fetch(`${API_URL}/${id}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error de servidor: ${response.status}`);
                    }
                    return response.json();
                })
                .then(role => {
                    // Llenar formulario
                    document.getElementById('updateNameRoleId').value = role.id;
                    document.getElementById('updateRoleName').value = role.roleName;
                    
                    updateNameModal.show();
                    statusMessage.style.display = 'none';
                })
                .catch(error => {
                    showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos del rol: ${error.message}`, 'danger');
                });
        }
        
        // Actualizar rol
        function updateRole(id, roleData) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando rol...', 'info');
            
            fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(roleData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error de servidor: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                showMessage('<i class="fas fa-check-circle"></i> Rol actualizado correctamente', 'success');
                loadRoles(); // Recargar la tabla
                editRoleModal.hide();
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar rol: ${error.message}`, 'danger');
            });
        }
        
        // Actualizar solo el nombre del rol
        function updateRoleName(id, roleName) {
            showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando nombre del rol...', 'info');
            
            const roleData = {
                id: parseInt(id),
                roleName: roleName
            };
            
            fetch(`${API_URL}/${id}/RoleName`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(roleData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error de servidor: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                showMessage('<i class="fas fa-check-circle"></i> Nombre del rol actualizado correctamente', 'success');
                loadRoles(); // Recargar la tabla
                updateNameModal.hide();
            })
            .catch(error => {
                showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar nombre del rol: ${error.message}`, 'danger');
            });
        }
        
        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Inicializar modales de Bootstrap 5
            addRoleModal = new bootstrap.Modal(document.getElementById('addRoleModal'));
            editRoleModal = new bootstrap.Modal(document.getElementById('editRoleModal'));
            updateNameModal = new bootstrap.Modal(document.getElementById('updateNameModal'));
            
            // Cargar datos al iniciar
            loadRoles();
            
            // Event listeners para botones
            loadDataBtn.addEventListener('click', loadRoles);
            testAPIBtn.addEventListener('click', testAPI);
            
            addRoleBtn.addEventListener('click', function() {
                document.getElementById('addRoleForm').reset();
                addRoleModal.show();
            });
            
            saveRoleBtn.addEventListener('click', function() {
                const roleData = {
                    roleName: document.getElementById('roleName').value,
                    isActive: document.getElementById('isActive').checked
                };
                createRole(roleData);
            });
            
            updateRoleBtn.addEventListener('click', function() {
                const id = document.getElementById('editRoleId').value;
                const roleData = {
                    id: parseInt(id),
                    roleName: document.getElementById('editRoleName').value,
                    isActive: document.getElementById('editIsActive').checked
                };
                updateRole(id, roleData);
            });
            
            saveNameBtn.addEventListener('click', function() {
                const id = document.getElementById('updateNameRoleId').value;
                const roleName = document.getElementById('updateRoleName').value;
                updateRoleName(id, roleName);
            });
        });