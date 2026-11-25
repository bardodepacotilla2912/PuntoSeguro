<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import L from "leaflet";

import { getCategories, getNearestPoints } from "../services/api";

const INITIAL_CENTER = [21.125, -101.686];
const INITIAL_ZOOM = 14;

const mapElement = ref(null);
const categories = ref([]);
const results = ref([]);
const selectedCategory = ref("all");

// Punto de partida (donde está la persona)
const origin = reactive({ lat: null, lng: null });

// Resumen de la ruta: distancia en km y tiempo en minutos
const route = reactive({ name: "", distance: "", duration: "" });

const errorMessage = ref("");

let map = null;
let originMarker = null;
let resultsLayer = null;
let routeLayer = null;

// Clic en el mapa = punto de partida
function setOrigin(event) {
  origin.lat = event.latlng.lat;
  origin.lng = event.latlng.lng;

  if (originMarker) {
    map.removeLayer(originMarker);
  }

  originMarker = L.circleMarker(event.latlng, {
    radius: 10,
    color: "#ffffff",
    weight: 3,
    fillColor: "#111827",
    fillOpacity: 1
  })
    .bindTooltip("Tú estás aquí")
    .addTo(map);

  searchNearest();
}

// Busca en el backend los puntos activos más cercanos ($near)
async function searchNearest() {
  if (origin.lat === null) {
    return;
  }

  errorMessage.value = "";
  routeLayer.clearLayers();
  route.name = "";

  try {
    const response = await getNearestPoints({
      lat: origin.lat,
      lng: origin.lng,
      category: selectedCategory.value
    });

    results.value = response.data;
    renderResults();
  } catch (error) {
    errorMessage.value = error.message;
  }
}

function renderResults() {
  resultsLayer.clearLayers();

  results.value.forEach((point) => {
    const [longitude, latitude] = point.location.coordinates;

    L.circleMarker([latitude, longitude], {
      radius: 9,
      color: "#ffffff",
      weight: 2,
      fillColor: point.category.color,
      fillOpacity: 0.95,
      bubblingMouseEvents: false
    })
      .bindPopup(`<strong>${point.name}</strong><br>${point.category.name}`)
      .addTo(resultsLayer);
  });
}

// Distancia en línea recta desde el punto de partida (Leaflet la calcula en metros)
function getDistance(point) {
  const [longitude, latitude] = point.location.coordinates;
  const meters = map.distance([origin.lat, origin.lng], [latitude, longitude]);

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

// Pide la ruta al servicio de OSRM (OpenStreetMap) y la dibuja en el mapa
async function showRoute(point) {
  const [longitude, latitude] = point.location.coordinates;

  const url =
    "https://router.project-osrm.org/route/v1/driving/" +
    `${origin.lng},${origin.lat};${longitude},${latitude}` +
    "?overview=full&geometries=geojson";

  errorMessage.value = "";
  routeLayer.clearLayers();

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== "Ok") {
      throw new Error("No se pudo calcular la ruta.");
    }

    const line = L.geoJSON(data.routes[0].geometry, {
      style: { color: "#dc2626", weight: 5 }
    }).addTo(routeLayer);

    map.fitBounds(line.getBounds(), { padding: [40, 40] });

    route.name = point.name;
    route.distance = (data.routes[0].distance / 1000).toFixed(1);
    route.duration = Math.round(data.routes[0].duration / 60);
  } catch (error) {
    errorMessage.value = "No se pudo calcular la ruta en este momento.";
  }
}

onMounted(async () => {
  map = L.map(mapElement.value).setView(INITIAL_CENTER, INITIAL_ZOOM);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  resultsLayer = L.layerGroup().addTo(map);
  routeLayer = L.layerGroup().addTo(map);

  map.on("click", setOrigin);

  try {
    const response = await getCategories();
    categories.value = response.data;
  } catch (error) {
    errorMessage.value = error.message;
  }
});

onBeforeUnmount(() => {
  map.remove();
});
</script>

<template>
  <div class="page">
    <h1>Punto de ayuda más cercano</h1>
    <p class="muted">Haz clic en el mapa en el lugar donde estás. Se mostrarán los 5 puntos activos más cercanos.</p>

    <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

    <div class="map-layout">
      <div ref="mapElement" class="map"></div>

      <aside class="side">
        <section class="card">
          <h2>¿Qué necesitas?</h2>
          <label>
            Categoría
            <select v-model="selectedCategory" @change="searchNearest">
              <option value="all">Cualquier ayuda</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </label>
          <p v-if="origin.lat === null" class="muted">Primero haz clic en el mapa.</p>
        </section>

        <section v-if="origin.lat !== null" class="card">
          <h2>Resultados</h2>
          <p v-if="results.length === 0" class="muted">No hay puntos activos cerca.</p>

          <ol class="results">
            <li v-for="point in results" :key="point.id">
              <strong>{{ point.name }}</strong>
              <span class="muted">{{ point.category.name }} · {{ getDistance(point) }}</span>
              <span>Teléfono: {{ point.phone || "—" }}</span>
              <span>Horario: {{ point.schedule || "—" }}</span>
              <button type="button" class="btn btn-primary btn-small" @click="showRoute(point)">
                Cómo llegar
              </button>
            </li>
          </ol>
        </section>

        <section v-if="route.name" class="card">
          <h2>Ruta</h2>
          <p>Hacia <strong>{{ route.name }}</strong></p>
          <p>{{ route.distance }} km · {{ route.duration }} min en auto</p>
        </section>
      </aside>
    </div>
  </div>
</template>
