<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";

import {
  getCategories,
  getHelpPoints,
  createHelpPoint,
  updateHelpPoint,
  deleteHelpPoint,
  getZones,
  createZone,
  deleteZone
} from "../services/api";
import { createNewPointForm, createPointPopup } from "../utils/popups";
import { validateName } from "../utils/validations";
import HelpPointsTable from "../components/HelpPointsTable.vue";

const INITIAL_CENTER = [21.125, -101.686];
const INITIAL_ZOOM = 13;

const mapElement = ref(null);
const categories = ref([]);
const points = ref([]);
const zones = ref([]);

const filters = reactive({
  search: "",
  category: "all",
  status: "all"
});

// Mensaje de éxito o error que se muestra arriba del mapa
const message = reactive({ text: "", type: "" });

let map = null;
let pointsLayer = null;
let zonesLayer = null;

function showMessage(text, type) {
  message.text = text;
  message.type = type;

  setTimeout(() => {
    message.text = "";
  }, 4000);
}

// ---------- Puntos de ayuda ----------
async function loadPoints() {
  try {
    // Los filtros se resuelven en el backend
    const response = await getHelpPoints(filters);
    points.value = response.data;
    renderPoints();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function renderPoints() {
  pointsLayer.clearLayers();

  points.value.forEach((point) => {
    const [longitude, latitude] = point.location.coordinates;

    const marker = L.circleMarker([latitude, longitude], {
      radius: 9,
      color: "#ffffff",
      weight: 2,
      fillColor: point.status === "activo" ? point.category.color : "#9ca3af",
      fillOpacity: 0.95,
      // El clic en el punto no debe llegar al mapa (no crea otro punto)
      bubblingMouseEvents: false
    });

    marker.bindPopup(
      createPointPopup(point, categories.value, marker, savePointChanges, removePoint),
      { minWidth: 260 }
    );

    marker.addTo(pointsLayer);
  });
}

function showNewPointForm(event) {
  // Mientras se dibuja una zona, el clic no registra puntos
  if (map.pm.globalDrawModeEnabled()) {
    return;
  }

  const form = createNewPointForm(event.latlng, categories.value, saveNewPoint, () => map.closePopup());

  L.popup({ minWidth: 260 })
    .setLatLng(event.latlng)
    .setContent(form)
    .openOn(map);
}

async function saveNewPoint(data) {
  const response = await createHelpPoint(data);
  map.closePopup();
  showMessage(response.message, "success");
  await loadPoints();
}

async function savePointChanges(id, data) {
  const response = await updateHelpPoint(id, data);
  map.closePopup();
  showMessage(response.message, "success");
  await loadPoints();
}

async function removePoint(point) {
  if (!confirm(`¿Eliminar "${point.name}"?`)) {
    return;
  }

  try {
    const response = await deleteHelpPoint(point.id);
    map.closePopup();
    showMessage(response.message, "success");
    await loadPoints();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

// ---------- Zonas ----------
async function loadZones() {
  try {
    const response = await getZones();
    zones.value = response.data;
    renderZones();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function renderZones() {
  zonesLayer.clearLayers();

  zones.value.forEach((zone) => {
    // GeoJSON guarda [longitud, latitud]; Leaflet usa [latitud, longitud]
    const latlngs = zone.area.coordinates[0].map(([longitude, latitude]) => [latitude, longitude]);

    L.polygon(latlngs, {
      color: "#7c3aed",
      weight: 2,
      fillOpacity: 0.1,
      // No recibe clics, así se pueden registrar puntos dentro de la zona
      interactive: false
    }).addTo(zonesLayer);
  });
}

// Geoman terminó de dibujar el polígono
async function saveDrawnZone(event) {
  const name = prompt("Nombre de la zona:");

  // El polígono dibujado se quita; se vuelve a pintar desde MongoDB
  map.removeLayer(event.layer);

  // Canceló el prompt
  if (name === null) {
    return;
  }

  const error = validateName(name, 3);

  if (error) {
    showMessage(error, "error");
    return;
  }

  try {
    // toGeoJSON() regresa las coordenadas en orden [longitud, latitud]
    const coordinates = event.layer.toGeoJSON().geometry.coordinates;

    const response = await createZone({ name, coordinates });
    showMessage(response.message, "success");
    await loadZones();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

async function removeZone(zone) {
  if (!confirm(`¿Eliminar la zona "${zone.name}"?`)) {
    return;
  }

  try {
    const response = await deleteZone(zone.id);
    showMessage(response.message, "success");
    await loadZones();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function resetFilters() {
  filters.search = "";
  filters.category = "all";
  filters.status = "all";
  loadPoints();
}

onMounted(async () => {
  map = L.map(mapElement.value).setView(INITIAL_CENTER, INITIAL_ZOOM);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  zonesLayer = L.layerGroup().addTo(map);
  pointsLayer = L.layerGroup().addTo(map);

  // Leaflet-Geoman: solo la herramienta para dibujar polígonos
  map.pm.setLang("es");
  map.pm.addControls({
    position: "topleft",
    drawMarker: false,
    drawCircleMarker: false,
    drawPolyline: false,
    drawRectangle: false,
    drawCircle: false,
    drawText: false,
    drawPolygon: true,
    editMode: false,
    dragMode: false,
    cutPolygon: false,
    removalMode: false,
    rotateMode: false
  });
  map.pm.setGlobalOptions({ allowSelfIntersection: false });

  map.on("pm:create", saveDrawnZone);
  map.on("click", showNewPointForm);

  try {
    const response = await getCategories();
    categories.value = response.data;
  } catch (error) {
    showMessage(error.message, "error");
  }

  await loadPoints();
  await loadZones();
});

onBeforeUnmount(() => {
  map.remove();
});
</script>

<template>
  <div class="page">
    <h1>Mapa de puntos de ayuda</h1>
    <p class="muted">
      Haz clic en el mapa para registrar un punto. Haz clic en un punto para editarlo o eliminarlo.
      Usa el botón de polígono para dibujar una zona.
    </p>

    <p v-if="message.text" :class="['message', message.type]">{{ message.text }}</p>

    <div class="map-layout">
      <div ref="mapElement" class="map"></div>

      <aside class="side">
        <section class="card">
          <h2>Búsqueda y filtros</h2>

          <label>
            Nombre
            <input v-model="filters.search" type="search" placeholder="Ej. hospital" @input="loadPoints" />
          </label>

          <label>
            Categoría
            <select v-model="filters.category" @change="loadPoints">
              <option value="all">Todas</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </label>

          <label>
            Estado
            <select v-model="filters.status" @change="loadPoints">
              <option value="all">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </label>

          <button type="button" class="btn btn-light btn-block" @click="resetFilters">Limpiar filtros</button>
        </section>

        <section class="card">
          <h2>Categorías</h2>
          <ul class="legend">
            <li v-for="category in categories" :key="category.id">
              <span class="dot" :style="{ background: category.color }"></span>
              {{ category.name }}
            </li>
          </ul>
        </section>

        <section class="card">
          <h2>Zonas ({{ zones.length }})</h2>
          <p v-if="zones.length === 0" class="muted">No hay zonas dibujadas.</p>
          <ul class="zone-list">
            <li v-for="zone in zones" :key="zone.id">
              <span>{{ zone.name }}</span>
              <button type="button" class="btn btn-danger btn-small" @click="removeZone(zone)">Eliminar</button>
            </li>
          </ul>
        </section>
      </aside>
    </div>

    <HelpPointsTable :points="points" />
  </div>
</template>
