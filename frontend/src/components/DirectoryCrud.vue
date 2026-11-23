<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";

import { api } from "../services/api";
import { useToast } from "../composables/useToast";
import { useConfirm } from "../composables/useConfirm";
import { humanize } from "../utils/format";
import { COLUMN_LABELS } from "../config/directory";
import ModalDialog from "./ModalDialog.vue";

/*
 * CRUD genérico del directorio. Recibe la configuración de la entidad
 * (endpoint, campos, columnas) desde config/directory.js
 */
const props = defineProps({
  entity: { type: Object, required: true },
  categories: { type: Array, default: () => [] }
});

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const items = ref([]);
const loading = ref(false);
const filters = reactive({ search: "", status: "all" });

const modalOpen = ref(false);
const editing = ref(null);
const saving = ref(false);
const formError = ref("");
const formDetails = ref([]);
const form = reactive({});
const helpPoints = ref([]);

const category = computed(() => props.categories.find((c) => c.slug === props.entity.categorySlug));

// Colores de estado: verde = disponible, ámbar = ocupado, rojo = no disponible
const GOOD = ["operando", "activa", "activo", "abierta"];
const WARN = ["saturado", "en_servicio"];
function statusClass(value) {
  if (GOOD.includes(value)) return "is-activo";
  if (WARN.includes(value)) return "is-warn";
  return "is-inactivo";
}

// ---------- Listado ----------
async function load() {
  loading.value = true;
  try {
    const response = await api.listDirectory(props.entity.endpoint, { ...filters });
    items.value = response.data;
  } catch (error) {
    toast.error(error.fullMessage || error.message);
  } finally {
    loading.value = false;
  }
}

let timer = null;
watch(() => filters.search, () => {
  clearTimeout(timer);
  timer = setTimeout(load, 300);
});
watch(() => filters.status, load);
watch(() => props.entity.key, () => {
  Object.assign(filters, { search: "", status: "all" });
  load();
});

// ---------- Formulario ----------
function defaultValue(field) {
  if (field.type === "checkbox") return false;
  if (field.key === "status") return props.entity.statuses[0];
  return "";
}

async function loadHelpPoints() {
  if (!category.value) return;
  try {
    const response = await api.listPoints({ category: category.value.id });
    helpPoints.value = response.data;
  } catch (error) {
    toast.error(error.fullMessage || error.message);
  }
}

function openCreate() {
  editing.value = null;
  Object.keys(form).forEach((key) => delete form[key]);
  props.entity.fields.forEach((field) => (form[field.key] = defaultValue(field)));
  form.helpPoint = "";
  formError.value = "";
  formDetails.value = [];
  modalOpen.value = true;
  loadHelpPoints();
}

function openEdit(item) {
  editing.value = item;
  Object.keys(form).forEach((key) => delete form[key]);
  props.entity.fields.forEach((field) => {
    const value = item[field.key];
    form[field.key] = field.type === "tags" ? (value || []).join(", ") : value ?? defaultValue(field);
  });
  form.helpPoint = item.helpPoint?.id || "";
  formError.value = "";
  formDetails.value = [];
  modalOpen.value = true;
  loadHelpPoints();
}

function buildBody() {
  const body = {};

  props.entity.fields.forEach((field) => {
    const value = form[field.key];

    if (field.type === "tags") {
      body[field.key] = String(value || "").split(",").map((s) => s.trim()).filter(Boolean);
    } else if (field.type === "number") {
      if (value !== "" && value !== null) body[field.key] = Number(value);
    } else if (field.type === "checkbox") {
      body[field.key] = Boolean(value);
    } else {
      body[field.key] = String(value ?? "").trim();
    }
  });

  body.helpPoint = form.helpPoint || null;
  return body;
}

function validate(body) {
  const errors = [];
  props.entity.fields.forEach((field) => {
    if (field.required && (body[field.key] === "" || body[field.key] === undefined)) {
      errors.push(`El campo "${field.label}" es obligatorio.`);
    }
  });
  return errors;
}

async function save() {
  const body = buildBody();
  const errors = validate(body);

  if (errors.length) {
    formError.value = "Revisa el formulario";
    formDetails.value = errors;
    return;
  }

  saving.value = true;
  formError.value = "";
  formDetails.value = [];

  try {
    const response = editing.value
      ? await api.updateDirectory(props.entity.endpoint, editing.value.id, body)
      : await api.createDirectory(props.entity.endpoint, body);

    toast.success(response.message);
    modalOpen.value = false;
    await load();
  } catch (error) {
    formError.value = error.message;
    formDetails.value = Array.isArray(error.details) ? error.details : [];
  } finally {
    saving.value = false;
  }
}

async function remove(item) {
  const ok = await confirm.ask({
    title: `Eliminar ${props.entity.singular}`,
    message: `Se eliminará "${item.name}" del directorio. El punto del mapa no se borra.`
  });
  if (!ok) return;

  try {
    const response = await api.deleteDirectory(props.entity.endpoint, item.id);
    toast.success(response.message);
    await load();
  } catch (error) {
    toast.error(error.fullMessage || error.message);
  }
}

function showOnMap(item) {
  router.push({ name: "map", query: { focus: item.helpPoint.id } });
}

// ---------- Celdas de la tabla ----------
function cell(item, key) {
  const value = item[key];
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (key === "type") return humanize(value);
  if (value === "" || value === null || value === undefined) return "—";
  return value;
}

onMounted(load);
</script>

<template>
  <section class="card">
    <div class="crud-toolbar">
      <label class="field">
        <span>Buscar</span>
        <input v-model="filters.search" type="search" :placeholder="`Nombre o dirección de ${entity.singular}…`" />
      </label>
      <label class="field">
        <span>Estado</span>
        <select v-model="filters.status">
          <option value="all">Todos</option>
          <option v-for="s in entity.statuses" :key="s" :value="s">{{ humanize(s) }}</option>
        </select>
      </label>
      <button type="button" class="btn btn-primary" @click="openCreate">+ {{ entity.newLabel }}</button>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="col in entity.columns" :key="col">{{ COLUMN_LABELS[col] }}</th>
            <th>Dirección</th>
            <th>Punto en el mapa</th>
            <th class="col-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="entity.columns.length + 3" class="empty">Cargando…</td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td :colspan="entity.columns.length + 3" class="empty">No hay registros.</td>
          </tr>
          <template v-else>
          <tr v-for="item in items" :key="item.id">
            <td v-for="col in entity.columns" :key="col" :class="{ strong: col === 'name' }">
              <span v-if="col === 'status'" :class="['badge badge-status', statusClass(item.status)]">{{ humanize(item.status) }}</span>
              <template v-else>{{ cell(item, col) }}</template>
            </td>
            <td class="cell-desc">{{ item.address }}</td>
            <td>
              <button v-if="item.helpPoint" type="button" class="link-btn" @click="showOnMap(item)">
                📍 {{ item.helpPoint.name }}
              </button>
              <span v-else class="muted">Sin vincular</span>
            </td>
            <td class="col-actions">
              <button type="button" class="btn btn-ghost btn-sm" @click="openEdit(item)">Editar</button>
              <button type="button" class="btn btn-danger-ghost btn-sm" @click="remove(item)">Eliminar</button>
            </td>
          </tr>
          </template>
        </tbody>
      </table>
    </div>

    <ModalDialog
      v-if="modalOpen"
      :title="editing ? `Editar ${entity.singular}` : entity.newLabel"
      wide
      @close="modalOpen = false"
    >
      <form class="form-grid" novalidate @submit.prevent="save">
        <template v-for="field in entity.fields" :key="field.key">
          <label v-if="field.type === 'checkbox'" class="check">
            <input v-model="form[field.key]" type="checkbox" />
            <span>{{ field.label }}</span>
          </label>

          <label v-else :class="['field', { 'field--wide': field.wide }]">
            <span>{{ field.label }}{{ field.required ? " *" : "" }}</span>

            <select v-if="field.type === 'select'" v-model="form[field.key]">
              <option value="" disabled>Selecciona…</option>
              <option v-for="opt in field.options" :key="opt" :value="opt">{{ humanize(opt) }}</option>
            </select>

            <input
              v-else-if="field.type === 'number'"
              v-model="form[field.key]"
              type="number"
              :min="field.min"
              step="1"
            />

            <input
              v-else
              v-model="form[field.key]"
              :type="field.type === 'tel' ? 'tel' : 'text'"
              :maxlength="field.maxlength"
            />
          </label>
        </template>

        <label class="field field--wide">
          <span>Punto en el mapa ({{ category?.icon }} {{ category?.name }})</span>
          <select v-model="form.helpPoint">
            <option value="">Sin vincular</option>
            <option v-for="p in helpPoints" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <small class="muted">Relación por referencia (ObjectId). Solo aparecen puntos de la categoría {{ category?.name }}.</small>
        </label>

        <div v-if="formError" class="alert alert--error field--wide" role="alert">
          <strong>{{ formError }}</strong>
          <ul v-if="formDetails.length">
            <li v-for="d in formDetails" :key="d">{{ d }}</li>
          </ul>
        </div>

        <div class="modal-actions field--wide">
          <button type="button" class="btn btn-ghost" @click="modalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? "Guardando…" : editing ? "Guardar cambios" : "Registrar" }}
          </button>
        </div>
      </form>
    </ModalDialog>
  </section>
</template>
