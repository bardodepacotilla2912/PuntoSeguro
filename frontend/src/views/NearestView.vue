<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import L from "leaflet";

import { api } from "../services/api";
import { useToast } from "../composables/useToast";
import { createBaseMap, categoryIcon, originIcon, toLatLng, LEON_CENTER } from "../utils/map";
import { formatDistance, formatDuration, escapeHtml } from "../utils/format";
import { getRoute, googleMapsLink } from "../utils/routing";

const toast = useToast();

const mapEl = ref(null);
const categories = ref([]);
const results = ref([]);
const loading = ref(false);
const locating = ref(false);
const selected = ref(null);
const route = ref(null); // { distance, duration, steps }
const routing = ref(false);

const options = reactive({ category: "all", limit: 5, maxDistance: 20 });
const origin = reactive({ lat: LEON_CENTER[0], lng: LEON_CENTER[1], label: "Centro de León (predeterminado)" });

let map = null;
let originMarker = null;
let resultsLayer = null;
let routeLayer = null;

// ---------- Búsqueda del punto más cercano ($geoNear en el backend) ----------
async function search() {
  loading.value = true;
  clearRoute();

  try {
    const response = await api.nearestPoints({
      lat: origin.lat,
      lng: origin.lng,
      category: options.category,
      limit: options.limit,
      maxDistance: options.maxDistance
    });

    results.value = response.data;
    renderResults();

    if (results.value.length === 0) {
      toast.info(`No hay puntos activos a menos de ${options.maxDistance} km.`);
    }
  } catch (error) {
    toast.error(error.fullMessage || error.message);
  } finally {
    loading.value = false;
  }
}

function renderResults() {
  resultsLayer.clearLayers();

  results.value.forEach((point, index) => {
    L.marker(toLatLng(point.location.coordinates), {
      icon: categoryIcon(point.category, { highlight: index === 0 }),
      title: point.name
    })
      .bindPopup(`<strong>${escapeHtml(point.name)}</strong><br>${formatDistance(point.distance)}`)
      .on("click", () => selectResult(point))
      .addTo(resultsLayer);
  });

  // Encuadra el origen y los resultados
  const bounds = L.latLngBounds([[origin.lat, origin.lng]]);
  results.value.forEach((p) => bounds.extend(toLatLng(p.location.coordinates)));
  if (results.value.length) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
}

// ---------- Origen ----------
function setOrigin(lat, lng, label) {
  Object.assign(origin, { lat, lng, label });
  originMarker.setLatLng([lat, lng]);
  search();
}

function useMyLocation() {
  if (!navigator.geolocation) {
    toast.error("Tu navegador no permite obtener la ubicación.");
    return;
  }

  locating.value = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      locating.value = false;
      const { latitude, longitude } = position.coords;
      setOrigin(latitude, longitude, "Mi ubicación actual");
      map.setView([latitude, longitude], 15);
      toast.success("Ubicación obtenida.");
    },
    () => {
      locating.value = false;
      toast.error("No se pudo obtener tu ubicación. Haz clic en el mapa para elegir el punto de partida.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ---------- Ruta ----------
function clearRoute() {
  routeLayer?.clearLayers();
  route.value = null;
  selected.value = null;
}

function selectResult(point) {
  selected.value = point;
  route.value = null;
  routeLayer.clearLayers();
}

function destinationOf(point) {
  const [lng, lat] = point.location.coordinates;
  return { lat, lng };
}

async function showRoute(point) {
  selected.value = point;
  routing.value = true;
  routeLayer.clearLayers();

  const destination = destinationOf(point);

  try {
    const result = await getRoute({ lat: origin.lat, lng: origin.lng }, destination);
    route.value = result;

    const line = L.geoJSON(result.geometry, {
      style: { color: "#dc2626", weight: 6, opacity: 0.85 }
    }).addTo(routeLayer);

    map.fitBounds(line.getBounds(), { padding: [50, 50] });
  } catch (error) {
    // Si el servicio de rutas falla se dibuja la línea recta
    L.polyline([[origin.lat, origin.lng], [destination.lat, destination.lng]], {
      color: "#dc2626",
      dashArray: "8 8",
      weight: 4
    }).addTo(routeLayer);
    route.value = null;
    toast.error(`${error.message} Se muestra la línea recta; puedes abrir la ruta en Google Maps.`);
  } finally {
    routing.value = false;
  }
}

watch(() => [options.category, options.limit, options.maxDistance], search);

onMounted(async () => {
  map = createBaseMap(mapEl.value, { zoom: 14 });
  resultsLayer = L.featureGroup().addTo(map);
  routeLayer = L.featureGroup().addTo(map);

  originMarker = L.marker([origin.lat, origin.lng], { icon: originIcon(), draggable: true, zIndexOffset: 1000 })
    .bindTooltip("Punto de partida (arrástralo)", { direction: "top", offset: [0, -10] })
    .addTo(map);

  originMarker.on("dragend", () => {
    const { lat, lng } = originMarker.getLatLng();
    setOrigin(lat, lng, "Punto elegido en el mapa");
  });

  map.on("click", (event) => setOrigin(event.latlng.lat, event.latlng.lng, "Punto elegido en el mapa"));

  await nextTick();
  map.invalidateSize();

  try {
    categories.value = (await api.categories()).data;
  } catch (error) {
    toast.error(error.fullMessage || error.message);
  }

  search();
});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
});
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>¿Dónde está la ayuda más cercana?</h1>
        <p class="muted">
          Usa tu ubicación o haz <strong>clic en el mapa</strong> para elegir el punto de partida.
          Te mostramos los puntos activos más cercanos y cómo llegar.
        </p>
      </div>
      <a class="btn btn-danger" href="tel:911">📞 Llamar al 911</a>
    </div>

    <div class="map-layout">
      <div class="card map-card">
        <div ref="mapEl" class="map"></div>
      </div>

      <aside class="side-panel">
        <section class="card">
          <div class="card-head"><h2>🧭 Punto de partida</h2></div>
          <p class="origin-label">
            <strong>{{ origin.label }}</strong><br />
            <span class="mono muted">{{ origin.lat.toFixed(5) }}, {{ origin.lng.toFixed(5) }}</span>
          </p>
          <button type="button" class="btn btn-primary btn-block" :disabled="locating" @click="useMyLocation">
            {{ locating ? "Obteniendo ubicación…" : "📍 Usar mi ubicación" }}
          </button>

          <div class="field-row">
            <label class="field">
              <span>¿Qué buscas?</span>
              <select v-model="options.category">
                <option value="all">Cualquier ayuda</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.icon }} {{ c.name }}</option>
              </select>
            </label>
            <label class="field">
              <span>Resultados</span>
              <select v-model.number="options.limit">
                <option :value="3">3</option>
                <option :value="5">5</option>
                <option :value="10">10</option>
              </select>
            </label>
          </div>
          <label class="field">
            <span>Radio máximo: {{ options.maxDistance }} km</span>
            <input v-model.number="options.maxDistance" type="range" min="1" max="50" step="1" />
          </label>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>Resultados</h2>
            <span class="muted">{{ loading ? "Buscando…" : `${results.length} encontrados` }}</span>
          </div>

          <p v-if="!loading && results.length === 0" class="empty">Sin puntos de ayuda en el radio seleccionado.</p>

          <ol class="result-list">
            <li
              v-for="(point, index) in results"
              :key="point.id"
              :class="{ 'is-selected': selected?.id === point.id }"
            >
              <button type="button" class="result-main" @click="selectResult(point)">
                <span class="result-icon" :style="{ '--marker-color': point.category?.color }">{{ point.category?.icon }}</span>
                <span class="result-text">
                  <strong>{{ point.name }}</strong>
                  <small>{{ point.category?.name }} · {{ point.schedule || "Horario no indicado" }}</small>
                </span>
                <span class="result-distance">
                  {{ formatDistance(point.distance) }}
                  <small v-if="index === 0" class="tag">Más cercano</small>
                </span>
              </button>

              <div v-if="selected?.id === point.id" class="result-detail">
                <p>{{ point.description }}</p>
                <dl class="popup-info">
                  <template v-if="point.phone">
                    <dt>Teléfono</dt>
                    <dd><a :href="`tel:${point.phone.replace(/\s/g, '')}`">{{ point.phone }}</a></dd>
                  </template>
                  <template v-if="point.directory">
                    <dt>Dirección</dt><dd>{{ point.directory.address }}</dd>
                    <template v-if="point.directory.emergencyPhone">
                      <dt>Urgencias</dt>
                      <dd><a :href="`tel:${point.directory.emergencyPhone}`">{{ point.directory.emergencyPhone }}</a></dd>
                    </template>
                  </template>
                </dl>
                <div class="popup-actions">
                  <a
                    class="btn btn-ghost btn-sm"
                    target="_blank"
                    rel="noopener"
                    :href="googleMapsLink(origin, destinationOf(point))"
                  >Google Maps ↗</a>
                  <button type="button" class="btn btn-primary btn-sm" :disabled="routing" @click="showRoute(point)">
                    {{ routing ? "Calculando…" : "🚗 Cómo llegar" }}
                  </button>
                </div>
              </div>
            </li>
          </ol>
        </section>

        <section v-if="route" class="card">
          <div class="card-head">
            <h2>Ruta en auto</h2>
            <span class="muted">{{ formatDistance(route.distance) }} · {{ formatDuration(route.duration) }}</span>
          </div>
          <ol class="steps">
            <li v-for="(step, i) in route.steps" :key="i">
              <span>{{ step.text }}</span>
              <small v-if="step.distance" class="muted">{{ formatDistance(step.distance) }}</small>
            </li>
          </ol>
          <p class="hint">Ruta calculada con OSRM / OpenStreetMap.</p>
        </section>
      </aside>
    </div>
  </div>
</template>
