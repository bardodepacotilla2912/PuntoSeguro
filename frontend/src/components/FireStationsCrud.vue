<script setup>
import { ref, reactive, onMounted } from "vue";

import { getItems, createItem, updateItem, deleteItem } from "../services/api";
import { validateName, validatePhone, validateAddress, validateInteger } from "../utils/validations";

const RESOURCE = "fire-stations";

const stations = ref([]);
const editingId = ref(null);
const message = reactive({ text: "", type: "" });

const filters = reactive({
  search: "",
  status: "all"
});

const form = reactive({
  name: "",
  status: "activa",
  phone: "",
  address: "",
  units: 0
});

function showMessage(text, type) {
  message.text = text;
  message.type = type;

  setTimeout(() => {
    message.text = "";
  }, 4000);
}

async function loadStations() {
  try {
    const response = await getItems(RESOURCE, filters);
    stations.value = response.data;
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function resetForm() {
  editingId.value = null;
  form.name = "";
  form.status = "activa";
  form.phone = "";
  form.address = "";
  form.units = 0;
}

function editStation(station) {
  editingId.value = station.id;
  form.name = station.name;
  form.status = station.status;
  form.phone = station.phone;
  form.address = station.address;
  form.units = station.units;
}

// Revisa los campos antes de enviarlos; regresa el primer error que encuentre
function validateForm() {
  return (
    validateName(form.name) ||
    validatePhone(form.phone) ||
    validateAddress(form.address) ||
    validateInteger(form.units, "unidades", 200)
  );
}

async function saveStation() {
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
    await loadStations();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

async function removeStation(station) {
  if (!confirm(`¿Eliminar "${station.name}"?`)) {
    return;
  }

  try {
    const response = await deleteItem(RESOURCE, station.id);
    showMessage(response.message, "success");
    await loadStations();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

onMounted(loadStations);
</script>

<template>
  <section class="card">
    <h2>{{ editingId ? "Editar estación de bomberos" : "Nueva estación de bomberos" }}</h2>

    <form class="form-grid" @submit.prevent="saveStation">
      <label>Nombre <input v-model="form.name" /></label>
      <label>Teléfono <input v-model="form.phone" type="tel" maxlength="12" placeholder="477 123 4567" /></label>
      <label class="wide">Dirección <input v-model="form.address" /></label>
      <label>
        Estado
        <select v-model="form.status">
          <option value="activa">Activa</option>
          <option value="en_servicio">En servicio</option>
          <option value="fuera_de_servicio">Fuera de servicio</option>
        </select>
      </label>
      <label>Unidades <input v-model="form.units" type="number" min="0" /></label>

      <div class="form-actions wide">
        <button v-if="editingId" type="button" class="btn btn-light" @click="resetForm">Cancelar</button>
        <button type="submit" class="btn btn-primary">{{ editingId ? "Guardar cambios" : "Registrar" }}</button>
      </div>
    </form>

    <p v-if="message.text" :class="['message', message.type]">{{ message.text }}</p>
  </section>

  <section class="card">
    <div class="filters">
      <input v-model="filters.search" type="search" placeholder="Buscar por nombre o dirección" @input="loadStations" />
      <select v-model="filters.status" @change="loadStations">
        <option value="all">Todos los estados</option>
        <option value="activa">Activa</option>
        <option value="en_servicio">En servicio</option>
        <option value="fuera_de_servicio">Fuera de servicio</option>
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
            <th>Unidades</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="stations.length === 0">
            <td colspan="6" class="empty">No hay estaciones registradas.</td>
          </tr>
          <tr v-for="station in stations" :key="station.id">
            <td><strong>{{ station.name }}</strong></td>
            <td>{{ station.status }}</td>
            <td>{{ station.phone }}</td>
            <td>{{ station.address }}</td>
            <td>{{ station.units }}</td>
            <td class="actions">
              <button type="button" class="btn btn-light btn-small" @click="editStation(station)">Editar</button>
              <button type="button" class="btn btn-danger btn-small" @click="removeStation(station)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
