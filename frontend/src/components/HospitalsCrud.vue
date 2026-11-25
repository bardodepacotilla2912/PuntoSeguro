<script setup>
import { ref, reactive, onMounted } from "vue";

import { getItems, createItem, updateItem, deleteItem } from "../services/api";
import { validateName, validatePhone, validateAddress, validateInteger } from "../utils/validations";

const RESOURCE = "hospitals";

const hospitals = ref([]);
const editingId = ref(null);
const message = reactive({ text: "", type: "" });

const filters = reactive({
  search: "",
  type: "all",
  status: "all"
});

const form = reactive({
  name: "",
  type: "hospital",
  status: "operando",
  phone: "",
  address: "",
  beds: 0
});

function showMessage(text, type) {
  message.text = text;
  message.type = type;

  setTimeout(() => {
    message.text = "";
  }, 4000);
}

async function loadHospitals() {
  try {
    const response = await getItems(RESOURCE, filters);
    hospitals.value = response.data;
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function resetForm() {
  editingId.value = null;
  form.name = "";
  form.type = "hospital";
  form.status = "operando";
  form.phone = "";
  form.address = "";
  form.beds = 0;
}

function editHospital(hospital) {
  editingId.value = hospital.id;
  form.name = hospital.name;
  form.type = hospital.type;
  form.status = hospital.status;
  form.phone = hospital.phone;
  form.address = hospital.address;
  form.beds = hospital.beds;
}

// Revisa los campos antes de enviarlos; regresa el primer error que encuentre
function validateForm() {
  return (
    validateName(form.name) ||
    validatePhone(form.phone) ||
    validateAddress(form.address) ||
    validateInteger(form.beds, "camas", 5000)
  );
}

async function saveHospital() {
  const error = validateForm();

  if (error) {
    showMessage(error, "error");
    return;
  }

  try {
    let response;

    if (editingId.value) {
      response = await updateItem(RESOURCE, editingId.value, { ...form });
    } else {
      response = await createItem(RESOURCE, { ...form });
    }

    showMessage(response.message, "success");
    resetForm();
    await loadHospitals();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

async function removeHospital(hospital) {
  if (!confirm(`¿Eliminar "${hospital.name}"?`)) {
    return;
  }

  try {
    const response = await deleteItem(RESOURCE, hospital.id);
    showMessage(response.message, "success");
    await loadHospitals();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

onMounted(loadHospitals);
</script>

<template>
  <section class="card">
    <h2>{{ editingId ? "Editar hospital" : "Nuevo hospital" }}</h2>

    <form class="form-grid" @submit.prevent="saveHospital">
      <label>Nombre <input v-model="form.name" /></label>
      <label>Teléfono <input v-model="form.phone" type="tel" maxlength="12" placeholder="477 123 4567" /></label>
      <label class="wide">Dirección <input v-model="form.address" /></label>
      <label>
        Tipo
        <select v-model="form.type">
          <option value="hospital">Hospital</option>
          <option value="clinica">Clínica</option>
          <option value="cruz_roja">Cruz Roja</option>
        </select>
      </label>
      <label>
        Estado
        <select v-model="form.status">
          <option value="operando">Operando</option>
          <option value="saturado">Saturado</option>
          <option value="cerrado">Cerrado</option>
        </select>
      </label>
      <label>Camas <input v-model="form.beds" type="number" min="0" /></label>

      <div class="form-actions wide">
        <button v-if="editingId" type="button" class="btn btn-light" @click="resetForm">Cancelar</button>
        <button type="submit" class="btn btn-primary">{{ editingId ? "Guardar cambios" : "Registrar" }}</button>
      </div>
    </form>

    <p v-if="message.text" :class="['message', message.type]">{{ message.text }}</p>
  </section>

  <section class="card">
    <div class="filters">
      <input v-model="filters.search" type="search" placeholder="Buscar por nombre o dirección" @input="loadHospitals" />
      <select v-model="filters.type" @change="loadHospitals">
        <option value="all">Todos los tipos</option>
        <option value="hospital">Hospital</option>
        <option value="clinica">Clínica</option>
        <option value="cruz_roja">Cruz Roja</option>
      </select>
      <select v-model="filters.status" @change="loadHospitals">
        <option value="all">Todos los estados</option>
        <option value="operando">Operando</option>
        <option value="saturado">Saturado</option>
        <option value="cerrado">Cerrado</option>
      </select>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th>Camas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="hospitals.length === 0">
            <td colspan="7" class="empty">No hay hospitales registrados.</td>
          </tr>
          <tr v-for="hospital in hospitals" :key="hospital.id">
            <td><strong>{{ hospital.name }}</strong></td>
            <td>{{ hospital.type }}</td>
            <td>{{ hospital.status }}</td>
            <td>{{ hospital.phone }}</td>
            <td>{{ hospital.address }}</td>
            <td>{{ hospital.beds }}</td>
            <td class="actions">
              <button type="button" class="btn btn-light btn-small" @click="editHospital(hospital)">Editar</button>
              <button type="button" class="btn btn-danger btn-small" @click="removeHospital(hospital)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
