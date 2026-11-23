<script setup>
import { formatCoord, formatDate, POINT_STATUS_LABELS } from "../utils/format";

// Tabla con todos los datos de los puntos, excepto el ID.
// Se vuelve a pintar sola cada vez que cambia el arreglo "points".
defineProps({
  points: { type: Array, default: () => [] },
  selectedId: { type: String, default: "" }
});

const emit = defineEmits(["select"]);
</script>

<template>
  <section class="card table-card">
    <div class="card-head">
      <h2>📋 Ubicaciones registradas</h2>
      <span class="muted">{{ points.length }} en la tabla · se actualiza al crear, editar o eliminar</span>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Teléfono</th>
            <th>Horario</th>
            <th>Latitud</th>
            <th>Longitud</th>
            <th>Registró</th>
            <th>Creado</th>
            <th>Actualizado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="points.length === 0">
            <td colspan="11" class="empty">No hay ubicaciones con esos filtros.</td>
          </tr>
          <tr
            v-for="point in points"
            :key="point.id"
            :class="{ 'is-selected': point.id === selectedId }"
            title="Ver en el mapa"
            @click="emit('select', point)"
          >
            <td class="strong">{{ point.name }}</td>
            <td>
              <span class="badge" :style="{ '--badge-color': point.category?.color }">
                {{ point.category?.icon }} {{ point.category?.name }}
              </span>
            </td>
            <td class="cell-desc">{{ point.description }}</td>
            <td><span :class="['badge badge-status', `is-${point.status}`]">{{ POINT_STATUS_LABELS[point.status] }}</span></td>
            <td>{{ point.phone || "—" }}</td>
            <td>{{ point.schedule || "—" }}</td>
            <td class="mono">{{ formatCoord(point.location.coordinates[1]) }}</td>
            <td class="mono">{{ formatCoord(point.location.coordinates[0]) }}</td>
            <td>{{ point.createdBy?.name || "—" }}</td>
            <td>{{ formatDate(point.createdAt) }}</td>
            <td>{{ formatDate(point.updatedAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
