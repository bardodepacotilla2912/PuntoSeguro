<script setup>
// Filtros que se mandan al backend: ?search=&category=&status=&zone=
const filters = defineModel({ type: Object, required: true });

defineProps({
  categories: { type: Array, default: () => [] },
  zones: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(["reset"]);
</script>

<template>
  <section class="card filters">
    <div class="card-head">
      <h2>🔎 Búsqueda y filtros</h2>
      <span class="muted">{{ loading ? "Buscando…" : `${total} resultado${total === 1 ? "" : "s"}` }}</span>
    </div>

    <label class="field">
      <span>Nombre</span>
      <input v-model="filters.search" type="search" placeholder="Ej. hospital, farmacia…" />
    </label>

    <label class="field">
      <span>Categoría</span>
      <select v-model="filters.category">
        <option value="all">Todas</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.icon }} {{ c.name }}</option>
      </select>
    </label>

    <div class="field-row">
      <label class="field">
        <span>Estado</span>
        <select v-model="filters.status">
          <option value="all">Todos</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </label>

      <label class="field">
        <span>Zona</span>
        <select v-model="filters.zone">
          <option value="all">Todas</option>
          <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
        </select>
      </label>
    </div>

    <button type="button" class="btn btn-ghost btn-block" @click="emit('reset')">Limpiar filtros</button>
  </section>
</template>
