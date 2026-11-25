<script setup>
// Tabla con todos los datos de los puntos, excepto el ID.
// Se vuelve a pintar sola cada vez que cambia "points".
defineProps({
  points: { type: Array, required: true }
});

function formatDate(value) {
  return new Date(value).toLocaleString("es-MX");
}
</script>

<template>
  <section class="card">
    <h2>Ubicaciones registradas ({{ points.length }})</h2>

    <div class="table-wrap">
      <table>
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
            <th>Creado</th>
            <th>Actualizado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="points.length === 0">
            <td colspan="10" class="empty">No hay ubicaciones con esos filtros.</td>
          </tr>
          <tr v-for="point in points" :key="point.id">
            <td><strong>{{ point.name }}</strong></td>
            <td>{{ point.category.name }}</td>
            <td>{{ point.description }}</td>
            <td>{{ point.status }}</td>
            <td>{{ point.phone || "—" }}</td>
            <td>{{ point.schedule || "—" }}</td>
            <td>{{ point.location.coordinates[1] }}</td>
            <td>{{ point.location.coordinates[0] }}</td>
            <td>{{ formatDate(point.createdAt) }}</td>
            <td>{{ formatDate(point.updatedAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
