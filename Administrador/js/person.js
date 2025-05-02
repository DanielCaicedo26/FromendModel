const API_URL = 'https://localhost:7182/api/person';
        
// Elementos DOM
const personTableBody = document.getElementById('personTableBody');
const statusMessage = document.getElementById('statusMessage');
const loadDataBtn = document.getElementById('loadDataBtn');
const testAPIBtn = document.getElementById('testAPIBtn');
const addPersonBtn = document.getElementById('addPersonBtn');
const savePersonBtn = document.getElementById('savePersonBtn');

// Referencias a modales para Bootstrap 5
let addPersonModal;
let editPersonModal;

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

// Cargar personas desde la API
function loadPersons() {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando personas...', 'info');
    
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
                personTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No hay personas disponibles</td></tr>';
                showMessage('No hay personas disponibles en el sistema', 'warning');
                return;
            }
            
            // Asegurarse de que data sea un array
            const persons = Array.isArray(data) ? data : [data];
            
            // Construir la tabla
            let html = '';
            persons.forEach(person => {
                html += `
                    <tr>
                        <td>${person.id}</td>
                        <td>${person.firstName}</td>
                        <td>${person.lastName}</td>
                        <td>${person.phone || 'N/A'}</td>
                        <td>${person.documentNumber}</td>
                        <td>${person.documentType}</td>
                        <td>
                            <span class="badge ${person.isActive ? 'bg-success' : 'bg-secondary'}">
                                ${person.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-warning edit-btn" data-id="${person.id}" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger delete-btn" data-id="${person.id}" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button class="btn btn-sm ${person.isActive ? 'btn-secondary' : 'btn-success'} toggle-btn" 
                                        data-id="${person.id}" data-active="${person.isActive}" title="${person.isActive ? 'Desactivar' : 'Activar'}">
                                    <i class="fas fa-${person.isActive ? 'times' : 'check'}"></i>
                                </button>
                                <button class="btn btn-sm btn-register register-btn" data-id="${person.id}" 
                                        data-name="${person.firstName} ${person.lastName}" title="Registrar como Usuario">
                                    <i class="fas fa-user-plus"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            personTableBody.innerHTML = html;
            showMessage(`${persons.length} personas cargadas correctamente`, 'success');
            
            // Agregar event listeners a los botones
            addButtonEventListeners();
        })
        .catch(error => {
            console.error('Error cargando personas:', error);
            personTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">
                <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
            </td></tr>`;
            showMessage(`<i class="fas fa-exclamation-triangle"></i> Error al cargar personas: ${error.message}`, 'danger');
        });
}

// Añadir event listeners a los botones en la tabla
function addButtonEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const personId = this.getAttribute('data-id');
            getPersonById(personId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const personId = this.getAttribute('data-id');
            deletePerson(personId);
        });
    });
    
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const personId = this.getAttribute('data-id');
            const currentStatus = this.getAttribute('data-active') === 'true';
            togglePersonStatus(personId, !currentStatus);
        });
    });
    
    document.querySelectorAll('.register-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const personId = this.getAttribute('data-id');
            const personName = this.getAttribute('data-name');
            registerAsUser(personId, personName);
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

// Redirigir para registrar como usuario
function registerAsUser(personId, personName) {
    window.location.href = `user.html?personId=${personId}&personName=${encodeURIComponent(personName)}&register=true`;
}

// Crear persona
function createPerson(personData) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Creando persona...', 'info');
    
    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(personData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showMessage('<i class="fas fa-check-circle"></i> Persona creada correctamente', 'success');
        loadPersons(); // Recargar la tabla
        addPersonModal.hide();
        document.getElementById('addPersonForm').reset();
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al crear persona: ${error.message}`, 'danger');
    });
}

// Eliminar persona
function deletePerson(id) {
    if (!confirm('¿Está seguro de eliminar esta persona?')) return;
    
    showMessage('<i class="fas fa-spinner fa-spin"></i> Eliminando persona...', 'info');
    
    fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        showMessage('<i class="fas fa-check-circle"></i> Persona eliminada correctamente', 'success');
        loadPersons(); // Recargar la tabla
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al eliminar persona: ${error.message}`, 'danger');
    });
}

// Cambiar estado de persona
function togglePersonStatus(id, newStatus) {
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
        loadPersons(); // Recargar la tabla
    })
    .catch(error => {
        showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar estado: ${error.message}`, 'danger');
    });
}

// Obtener persona por ID
function getPersonById(id) {
    showMessage('<i class="fas fa-spinner fa-spin"></i> Cargando datos de la persona...', 'info');
    
    fetch(`${API_URL}/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error de servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(person => {
            // Primero mostrar el modal
            editPersonModal.show();
            
            // Luego, llenar el formulario con un pequeño retraso para asegurar que el DOM esté listo
            setTimeout(() => {
                try {
                    // Verificamos que cada elemento exista antes de asignarle un valor
                    const editPersonIdField = document.getElementById('editPersonId');
                    if (editPersonIdField) editPersonIdField.value = person.id;
                    
                    const editFirstNameField = document.getElementById('editFirstName');
                    if (editFirstNameField) editFirstNameField.value = person.firstName;
                    
                    const editLastNameField = document.getElementById('editLastName');
                    if (editLastNameField) editLastNameField.value = person.lastName;
                    
                    const editPhoneField = document.getElementById('editPhone');
                    if (editPhoneField) editPhoneField.value = person.phone || '';
                    
                    const editIsActiveField = document.getElementById('editIsActive');
                    if (editIsActiveField) editIsActiveField.checked = person.isActive;
                    
                    const editDocumentNumberField = document.getElementById('editDocumentNumber');
                    if (editDocumentNumberField) editDocumentNumberField.value = person.documentNumber;
                    
                    const editDocumentTypeField = document.getElementById('editDocumentType');
                    if (editDocumentTypeField) editDocumentTypeField.value = person.documentType || 'DNI';
                    
                    statusMessage.style.display = 'none';
                } catch (error) {
                    console.error("Error al llenar el formulario:", error);
                    showMessage(`<i class="fas fa-times-circle"></i> Error al llenar el formulario: ${error.message}`, 'danger');
                }
            }, 300); // Un pequeño retraso para asegurar que el modal esté completamente visible
        })
        .catch(error => {
            showMessage(`<i class="fas fa-times-circle"></i> Error al obtener datos de la persona: ${error.message}`, 'danger');
        });
}

// Actualizar persona
function updatePerson(id, personData) {
    console.log('Iniciando actualización de persona con ID:', id);
    console.log('Datos a enviar:', personData);
    
    showMessage('<i class="fas fa-spinner fa-spin"></i> Actualizando persona...', 'info');

    fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(personData)
    })
    .then(response => {
        console.log('Respuesta recibida:', response);
        if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Datos actualizados:', data);
        showMessage('<i class="fas fa-check-circle"></i> Persona actualizada correctamente', 'success');
        loadPersons(); // Recargar la tabla
        editPersonModal.hide();
        document.getElementById('editPersonForm').reset();
    })
    .catch(error => {
        console.error('Error en la actualización:', error);
        showMessage(`<i class="fas fa-times-circle"></i> Error al actualizar persona: ${error.message}`, 'danger');
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar modales de Bootstrap 5
    addPersonModal = new bootstrap.Modal(document.getElementById('addPersonModal'));
    editPersonModal = new bootstrap.Modal(document.getElementById('editPersonModal'));
    
    // Cargar datos al iniciar
    loadPersons();
    
    // Event listeners para botones
    loadDataBtn.addEventListener('click', loadPersons);
    testAPIBtn.addEventListener('click', testAPI);
    
    addPersonBtn.addEventListener('click', function() {
        document.getElementById('addPersonForm').reset();
        addPersonModal.show();
    });
    
    savePersonBtn.addEventListener('click', function() {
        const personData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            phone: document.getElementById('phone').value,
            isActive: document.getElementById('isActive').checked,
            documentNumber: document.getElementById('documentNumber').value,
            documentType: document.getElementById('documentType').value
        };
        createPerson(personData);
    });
    
    // SOLUCIÓN: NO intentar asignar el evento al botón de actualizar aquí
    // El botón está dentro del modal y no estará disponible hasta que el modal se muestre
    
    // Asignar el evento cuando el modal se muestre
    document.getElementById('editPersonModal').addEventListener('shown.bs.modal', function () {
        console.log("Modal mostrado, asignando evento al botón de actualizar");
        
        const updateBtn = document.getElementById('updatePersonBtn');
        if (updateBtn) {
            updateBtn.onclick = function() {
                console.log("Botón de actualizar clickeado (desde evento modal)");
                
                try {
                    const id = document.getElementById('editPersonId').value;
                    console.log("ID a actualizar:", id);
                    
                    if (!id) {
                        console.error("ID no encontrado");
                        showMessage('<i class="fas fa-exclamation-triangle"></i> Error: ID de persona no encontrado', 'danger');
                        return;
                    }
                    
                    const personData = {
                        id: parseInt(id),
                        firstName: document.getElementById('editFirstName').value,
                        lastName: document.getElementById('editLastName').value,
                        phone: document.getElementById('editPhone').value,
                        isActive: document.getElementById('editIsActive').checked,
                        documentNumber: document.getElementById('editDocumentNumber').value,
                        documentType: document.getElementById('editDocumentType').value
                    };
                    
                    console.log("Datos a enviar:", personData);
                    updatePerson(id, personData);
                } catch (error) {
                    console.error("Error preparando datos:", error);
                    showMessage(`<i class="fas fa-times-circle"></i> Error: ${error.message}`, 'danger');
                }
            };
        } else {
            console.error("Botón de actualizar no encontrado en el modal");
            showMessage(`<i class="fas fa-exclamation-triangle"></i> Error: Botón de actualizar no encontrado`, 'danger');
        }

      
});
    });
