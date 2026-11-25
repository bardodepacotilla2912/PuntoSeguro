<script setup>
import { ref, reactive, onMounted } from "vue";

import { getItems, createItem, updateItem, deleteItem } from "../services/api";
import { validateName, validatePhone, validateAddress, validateSchedule } from "../utils/validations";

const RESOURCE = "pharmacies";

const pharmacies = ref([]);
const editingId = ref(null);
const message = reactive({ text: "", type: "" });

const filters = reactive({
  search: "",
  status: "all"
});

const form = reactive({
  name: "",
  status: "abierta",
  phone: "",
  address: "",
  schedule: ""
});

function showMessage(text, type) {
  message.text = text;
  message.type = type;

  setTimeout(() => {
    message.text = "";
  }, 4000);
}

async function loadPharmacies() {
  try {
    const response = await getItems(RESOURCE, filters);
    pharmacies.value = response.data;
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function resetForm() {
  editingId.value = null;
  form.name = "";
  form.status = "abierta";
  form.phone = "";
  form.address = "";
  form.schedule = "";
}

function editPharmacy(pharmacy) {
  editingId.value = pharmacy.id;
  form.name = pharmacy.name;
  form.status = pharmacy.status;
  form.phone = pharmacy.phone;
  form.address = pharmacy.address;
  form.schedule = pharmacy.schedule;
}

// Revisa los campos antes de enviarlos; regresa el primer error que encuentre
function validateForm() {
  return (
    validateName(form.name) ||
    validatePhone(form.phone) ||
    validateAddress(form.address) ||
    validateSchedule(form.schedule)
  );
}

async function savePharmacy() {
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
    await loadPharmacies();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

async function removePharmacy(pharmacy) {
  if (!confirm(`¿Eliminar "${pharmacy.name}"?`)) {
    return;
  }

  try {
    const response = await deleteItem(RESOURCE, pharmacy.id);
    showMessage(response.message, "success");
    await loadPharmacies();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

onMounted(loadPharmacies);
</script>

<template>
  <section class="card">
    <h2>{{ editingId ? "Editar farmacia" : "Nueva farmacia" }}</h2>

    <form class="form-grid" @submit.prevent="savePharmacy">
      <label>Nombre <input v-model="form.name" /></label>
      <label>Teléfono <input v-model="form.phone" type="tel" maxlength="12" placeholder="477 123 4567" /></label>
      <label class="wide">Dirección <input v-model="form.address" /></label>
      <label>
        Estado
        <select v-model="form.status">
          <option value="abierta">Abierta</option>
          <option value="cerrada">Cerrada</option>
        </select>
      </label>
      <label>Horario <input v-model="form.schedule" placeholder="24 horas u 08:00 - 22:00" /></label>

      <div class="form-actions wide">
        <button v-if="editingId" type="button" class="btn btn-light" @click="resetForm">Cancelar</button>
        <button type="submit" class="btn btn-primary">{{ editingId ? "Guardar cambios" : "Registrar" }}</button>
      </div>
    </form>

    <p v-if="message.text" :class="['message', message.type]">{{ message.text }}</p>
  </section>

  <section class="card">
    <div class="filters">
      <input v-model="filters.search" type="search" placeholder="Buscar por nombre o dirección" @input="loadPharmacies" />
      <select v-model="filters.status" @change="loadPharmacies">
        <option value="all">Todos los estados</option>
        <option value="abierta">Abierta</option>
        <option value="cerrada">Cerrada</option>
      </select>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th>Horario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pharmacies.length === 0">
            <td colspan="6" class="empty">No hay farmacias registradas.</td>
          </tr>
          <tr v-for="pharmacy in pharmacies" :key="pharmacy.id">
            <td><strong>{{ pharmacy.name }}</strong></td>
            <td>{{ pharmacy.status }}</td>
            <td>{{ pharmacy.phone }}</td>
            <td>{{ pharmacy.address }}</td>
            <td>{{ pharmacy.schedule }}</td>
            <td class="actions">
              <button type="button" class="btn btn-light btn-small" @click="editPharmacy(pharmacy)">Editar</button>
              <button type="button" class="btn btn-danger btn-small" @click="removePharmacy(pharmacy)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
