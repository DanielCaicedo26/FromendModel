  // Configuración API
  const API_URL = 'https://localhost:7182/api/RoleUser';
  const USER_API_URL = 'https://localhost:7182/api/User';
  const ROLE_API_URL = 'https://localhost:7182/api/Role';
  
  // Elementos DOM
  const roleUserTableBody = document.getElementById('roleUserTableBody');
  const statusMessage = document.getElementById('statusMessage');
  const loadDataBtn = document.getElementById('loadDataBtn');
  const testAPIBtn = document.getElementById('testAPIBtn');
  const addRoleUserBtn = document.getElementById('addRoleUserBtn');
  const saveRoleUserBtn = document.getElementById('saveRoleUserBtn');
  const updateRoleUserBtn = document.getElementById('updateRoleUserBtn');
  const savePartialBtn = document.getElementById('savePartialBtn');
  
  // Referencias a modales para Bootstrap 5
  let addRoleUserModal;
  let editRoleUserModal;
  let updatePartialModal;
  
  // Datos cacheados
  let users = [];
  let roles = [];
  
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
  
  // Cargar usuarios para los selectores
  async function loadUsers() {
      try {
          const response = await fetch(USER_API_URL);
          if (!response.ok) {
              throw new Error(`Error al cargar usuarios: ${response.status}`);
          }
          
          users = await response.json();
          
          // Actualizar todos los selectores de usuarios
          const selectors = ['userId', 'editUserId', 'partialUserId'];
          selectors.forEach(id => {
              const selector = document.getElementById(id);
              if (selector) {
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
              }
          });
          
          return true;
      } catch (error) {
          console.error('Error al cargar usuarios:', error);
          showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar usuarios: ${error.message}`, 'danger');
          return false;
      }
  }
  
  // Cargar roles para los selectores
  async function loadRoles() {
      try {
          const response = await fetch(ROLE_API_URL);
          if (!response.ok) {
              throw new Error(`Error al cargar roles: ${response.status}`);
          }
          
          roles = await response.json();
          
          // Actualizar todos los selectores de roles
          const selectors = ['roleId', 'editRoleId', 'partialRoleId'];
          selectors.forEach(id => {
              const selector = document.getElementById(id);
              if (selector) {
                  // Mantener la opción predeterminada
                  const defaultOption = selector.options[0];
                  selector.innerHTML = '';
                  selector.appendChild(defaultOption);
                  
                  // Añadir opciones de roles
                  roles.forEach(role => {
                      const option = document.createElement('option');
                      option.value = role.id;
                      option.textContent = role.roleName;
                      selector.appendChild(option);
                  });
              }
          });
          
          return true;
      } catch (error) {
          console.error('Error al cargar roles:', error);
          showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar roles: ${error.message}`, 'danger');
          return false;
      }
  }
  
  // Obtener nombre de usuario por ID
  function getUsernameById(userId) {
      const user = users.find(u => u.id === userId);
      return user ? `${user.username} (${user.email})` : `Usuario ID: ${userId}`;
  }
  
  // Obtener nombre de rol por ID
  function getRoleNameById(roleId) {
      const role = roles.find(r => r.id === roleId);
      return role ? role.roleName : `Rol ID: ${roleId}`;
  }
  
  // Formatear fecha
  function formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString();
  }
  
  // Cargar asignaciones de roles desde la API
  async function loadRoleUsers() {
      showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando asignaciones de roles...', 'info');
      
      try {
          // Asegurarse de que tenemos los datos de usuarios y roles
          await Promise.all([loadUsers(), loadRoles()]);
          
          const response = await fetch(API_URL);
          if (!response.ok) {
              throw new Error(`Error de servidor: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Datos recibidos:', data);
          
          if (!data || (Array.isArray(data) && data.length === 0)) {
              roleUserTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay asignaciones de roles disponibles</td></tr>';
              showMessage('No hay asignaciones de roles disponibles en el sistema', 'warning');
              return;
          }
          
          // Asegurarse de que data sea un array
          const roleUsers = Array.isArray(data) ? data : [data];
          
          // Construir la tabla
          let html = '';
          roleUsers.forEach(roleUser => {
              html += `
                  <tr>
                      <td>${roleUser.id}</td>
                      <td>${getUsernameById(roleUser.userId)}</td>
                      <td>${getRoleNameById(roleUser.roleId)}</td>
                      <td>
                          <span class="badge ${roleUser.isActive ? 'bg-success' : 'bg-secondary'}">
                              ${roleUser.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                      </td>
                      <td>${formatDate(roleUser.createdAt)}</td>
                      <td>
                          <div class="btn-group" role="group">
                              <button class="btn btn-sm btn-warning edit-btn" data-id="${roleUser.id}" title="Editar">
                                  <i class="fas fa-edit"></i>
                              </button>
                              <button class="btn btn-sm btn-info update-partial-btn" data-id="${roleUser.id}" title="Actualizar Usuario/Rol">
                                  <i class="fas fa-user-tag"></i>
                              </button>
                              <button class="btn btn-sm btn-danger delete-btn" data-id="${roleUser.id}" title="Eliminar">
                                  <i class="fas fa-trash"></i>
                              </button>
                              <button class="btn btn-sm ${roleUser.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                      data-id="${roleUser.id}" data-active="${roleUser.isActive}" title="${roleUser.isActive ? 'Desactivar' : 'Activar'}">
                                  <i class="fas fa-${roleUser.isActive ? 'times' : 'check'}"></i>
                              </button>
                          </div>
                      </td>
                  </tr>
              `;
          });
          
          roleUserTableBody.innerHTML = html;
          showMessage(`${roleUsers.length} asignaciones de roles cargadas correctamente`, 'success');
          
          // Agregar event listeners a los botones
          addButtonEventListeners();
          
      } catch (error) {
          console.error('Error cargando asignaciones de roles:', error);
          roleUserTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">
              <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
          </td></tr>`;
          showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar asignaciones de roles: ${error.message}`, 'danger');
      }
  }
  
  // Añadir event listeners a los botones en la tabla
  function addButtonEventListeners() {
      document.querySelectorAll('.edit-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const roleUserId = this.getAttribute('data-id');
              getRoleUserById(roleUserId);
          });
      });
      
      document.querySelectorAll('.update-partial-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const roleUserId = this.getAttribute('data-id');
              getRoleUserForPartialUpdate(roleUserId);
          });
      });
      
      document.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const roleUserId = this.getAttribute('data-id');
              deleteRoleUser(roleUserId);
          });
      });
      
      document.querySelectorAll('.toggle-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const roleUserId = this.getAttribute('data-id');
              const currentStatus = this.getAttribute('data-active') === 'true';
              toggleRoleUserStatus(roleUserId, !currentStatus);
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
  
  // Crear asignación de rol
  function createRoleUser(roleUserData) {
      showMessage('<i class="fas fa-spinner fa-spin"></i> Creando asignación de rol...', 'info');
      
      fetch(API_URL, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(roleUserData)
      })
      .then(response => {
          if (!response.ok) {
              throw new Error(`Error de servidor: ${response.status}`);
          }
          return response.json();
      })
      .then(data => {
          showMessage('<i class="fas fa-check-circle"></i> Asignación de rol creada correctamente', 'success');
          loadRoleUsers(); // Recargar la tabla
          addRoleUserModal.hide();
          document.getElementById('addRoleUserForm').reset();
      })
      .catch(error => {
          showMessage(`<i class="fas fa-times-circle"></i> Error al crear asignación de rol: ${error.message}`, 'danger');
      });
  }
  
  // Eliminar asignación de rol
  function deleteRoleUser(id) {
      if (!confirm('¿Está seguro de eliminar esta asignación de rol?')) return;
      
      showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando asignación de rol...', 'info');
      
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
          showMessage('<i class="fas fa-check-circle"></i> Asignación de rol eliminada correctamente', 'success');
          loadRoleUsers(); // Recargar la tabla
      })
      .catch(error => {
          showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar asignación de rol: ${error.message}`, 'danger');
      });
  }
  
  // Cambiar estado de asignación de rol
  function toggleRoleUserStatus(id, newStatus) {
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
          loadRoleUsers(); // Recargar la tabla
      })
      .catch(error => {
          showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
      });
  }
  
  // Obtener asignación de rol por ID
  function getRoleUserById(id) {
      showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos de asignación de rol...', 'info');
      
      fetch(`${API_URL}/${id}`)
          .then(response => {
              if (!response.ok) {
                  throw new Error(`Error de servidor: ${response.status}`);
              }
              return response.json();
          })
          .then(roleUser => {
              // Llenar formulario
              document.getElementById('editRoleUserId').value = roleUser.id;
              document.getElementById('editUserId').value = roleUser.userId;
              document.getElementById('editRoleId').value = roleUser.roleId;
              document.getElementById('editIsActive').checked = roleUser.isActive;
              
              editRoleUserModal.show();
              statusMessage.style.display = 'none';
          })
          .catch(error => {
              showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos de asignación de rol: ${error.message}`, 'danger');
          });
  }
  
  // Obtener asignación de rol para actualización parcial
  function getRoleUserForPartialUpdate(id) {
      showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos de asignación de rol...', 'info');
      
      fetch(`${API_URL}/${id}`)
          .then(response => {
              if (!response.ok) {
                  throw new Error(`Error de servidor: ${response.status}`);
              }
              return response.json();
          })
          .then(roleUser => {
              // Llenar formulario
              document.getElementById('partialRoleUserId').value = roleUser.id;
              document.getElementById('partialUserId').value = roleUser.userId;
              document.getElementById('partialRoleId').value = roleUser.roleId;
              
              updatePartialModal.show();
              statusMessage.style.display = 'none';
          })
          .catch(error => {
              showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos de asignación de rol: ${error.message}`, 'danger');
          });
  }
  
  // Actualizar asignación de rol
  function updateRoleUser(id, roleUserData) {
      showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando asignación de rol...', 'info');
      
      fetch(`${API_URL}/${id}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(roleUserData)
      })
      .then(response => {
          if (!response.ok) {
              throw new Error(`Error de servidor: ${response.status}`);
          }
          return response.json();
      })
      .then(data => {
          showMessage('<i class="fas fa-check-circle"></i> Asignación de rol actualizada correctamente', 'success');
          loadRoleUsers(); // Recargar la tabla
          editRoleUserModal.hide();
      })
      .catch(error => {
          showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar asignación de rol: ${error.message}`, 'danger');
      });
  }
  
  // Actualizar parcialmente asignación de rol (solo roleId y userId)
  function updatePartial(id, roleId, userId) {
      showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando asignación...', 'info');
      
      const roleUserData = {
          id: parseInt(id),
          roleId: parseInt(roleId),
          userId: parseInt(userId)
      };
      
      fetch(`${API_URL}/${id}/RoleId-UserId`, {
          method: 'PATCH',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(roleUserData)
      })
      .then(response => {
          if (!response.ok) {
              throw new Error(`Error de servidor: ${response.status}`);
          }
          return response.json();
      })
      .then(data => {
          showMessage('<i class="fas fa-check-circle"></i> Asignación actualizada correctamente', 'success');
          loadRoleUsers(); // Recargar la tabla
          updatePartialModal.hide();
      })
      .catch(error => {
          showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar asignación: ${error.message}`, 'danger');
      });
  }
  
  // Event listeners
  document.addEventListener('DOMContentLoaded', function() {
      // Inicializar modales de Bootstrap 5
      addRoleUserModal = new bootstrap.Modal(document.getElementById('addRoleUserModal'));
      editRoleUserModal = new bootstrap.Modal(document.getElementById('editRoleUserModal'));
      updatePartialModal = new bootstrap.Modal(document.getElementById('updatePartialModal'));
      
      // Cargar datos al iniciar
      loadRoleUsers();
      
      // Event listeners para botones
      loadDataBtn.addEventListener('click', loadRoleUsers);
      testAPIBtn.addEventListener('click', testAPI);
      
      addRoleUserBtn.addEventListener('click', function() {
          loadUsers().then(() => loadRoles()).then(() => {
              document.getElementById('addRoleUserForm').reset();
              addRoleUserModal.show();
          });
      });
      
      saveRoleUserBtn.addEventListener('click', function() {
          const roleUserData = {
              userId: parseInt(document.getElementById('userId').value),
              roleId: parseInt(document.getElementById('roleId').value),
              isActive: document.getElementById('isActive').checked
          };
          
          // Validaciones
          if (!roleUserData.userId || !roleUserData.roleId) {
              showMessage('Por favor, seleccione tanto un usuario como un rol', 'warning');
              return;
          }
          
          createRoleUser(roleUserData);
      });
      
      updateRoleUserBtn.addEventListener('click', function() {
          const id = document.getElementById('editRoleUserId').value;
          const roleUserData = {
              id: parseInt(id),
              userId: parseInt(document.getElementById('editUserId').value),
              roleId: parseInt(document.getElementById('editRoleId').value),
              isActive: document.getElementById('editIsActive').checked
          };
          
          // Validaciones
          if (!roleUserData.userId || !roleUserData.roleId) {
              showMessage('Por favor, seleccione tanto un usuario como un rol', 'warning');
              return;
          }
          
          updateRoleUser(id, roleUserData);
      });
      
      savePartialBtn.addEventListener('click', function() {
          const id = document.getElementById('partialRoleUserId').value;
          const roleId = document.getElementById('partialRoleId').value;
          const userId = document.getElementById('partialUserId').value;
          
          // Validaciones
          if (!userId || !roleId) {
              showMessage('Por favor, seleccione tanto un usuario como un rol', 'warning');
              return;
          }
          
          updatePartial(id, roleId, userId);
      });
  });