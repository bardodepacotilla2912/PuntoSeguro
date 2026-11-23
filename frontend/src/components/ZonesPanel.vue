<script setup>
defineProps({
  zones: { type: Array, default: () => [] },
  activeZone: { type: String, default: "all" }
});

const emit = defineEmits(["focus", "filter", "delete"]);
</script>

<template>
  <section class="card zones">
    <div class="card-head">
      <h2>⬡ Zonas</h2>
      <span class="muted">{{ zones.length }}</span>
    </div>

    <p class="hint">
      Usa la herramienta <strong>polígono</strong> o <strong>rectángulo</strong> de la barra del mapa para dibujar una zona.
      Con el lápiz puedes mover sus vértices.
    </p>

    <p v-if="zones.length === 0" class="empty">Aún no hay zonas dibujadas.</p>

    <ul class="zone-list">
      <li v-for="zone in zones" :key="zone.id" :class="{ 'is-active': activeZone === zone.id }">
        <button type="button" class="zone-name" @click="emit('focus', zone)">
          <span class="zone-swatch" :style="{ background: zone.color }"></span>
          <span>{{ zone.name }}</span>
          <small class="muted">{{ zone.pointsInside }} pts</small>
        </button>
        <button type="button" class="icon-btn" title="Filtrar puntos de esta zona" @click="emit('filter', zone)">🔎</button>
        <button type="button" class="icon-btn icon-btn--danger" title="Eliminar zona" @click="emit('delete', zone)">🗑</button>
      </li>
    </ul>
  </section>
</template>
