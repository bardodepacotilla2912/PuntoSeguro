<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute } from "vue-router";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";

import { api } from "../services/api";
import { useToast } from "../composables/useToast";
import { useConfirm } from "../composables/useConfirm";
import { createBaseMap, categoryIcon, toLatLng, ringToLatLngs } from "../utils/map";
import { newPointPopup, pointPopup, zonePopup } from "../utils/popups";

import PointFilters from "../components/PointFilters.vue";
import ZonesPanel from "../components/ZonesPanel.vue";
import HelpPointsTable from "../components/HelpPointsTable.vue";
import ModalDialog from "../components/ModalDialog.vue";

const route = useRoute();
const toast = useToast();
const confirm = useConfirm();

// ---------- Estado de la vista ----------
const mapEl = ref(null);
const categories = ref([]);
const zones = ref([]);
const points = ref([]);
const loading = ref(false);
const selectedId = ref("");

const filters = reactive({ search: "", category: "all", status: "all", zone: "all" });

// Formulario de la zona recién dibujada
const zoneModalOpen = ref(false);
const zoneForm = reactive({ name: "", description: "", color: "#7c3aed", saving: false, error: "" });

// Objetos de Leaflet: NO se guardan en ref() para que Vue no los vuelva reactivos
let map = null;
let pointsLayer = null;
let zonesLayer = null;
let pendingZoneLayer = null;
const markers = new Map();

// ---------- Carga de datos ----------
async function loadCategories() {
  const response = await api.categories();
  categories.value = response.data;
}

async function loadPoints() {
  loading.value = true;
  try {
    // Los filtros se resuelven en el backend
    const response = await api.listPoints({ ...filters });
    points.value = response.data;
    renderPoints();
  } catch (error) {
    toast.error(error.fullMessage || error.message);
  } finally {
    loading.value = false;
  }
}

async function loadZones() {
  try {
    const response = await api.listZones();
    zones.value = response.data;
    renderZones();
  } catch (error) {
    toast.error(error.fullMessage || error.message);
  }
}

// Recarga puntos y conteos de zonas (después de crear / editar / eliminar)
async function refreshAll() {
  await Promise.all([loadPoints(), loadZones()]);
}

// ---------- Puntos (marcadores) ----------
function renderPoints() {
  pointsLayer.clearLayers();
  markers.clear();

  points.value.forEach((point) => {
    const marker = L.marker(toLatLng(point.location.coordinates), {
      icon: categoryIcon(point.category, { inactive: point.status === "inactivo" }),
      title: point.name,
      pmIgnore: true // Geoman no debe editar los marcadores
    });

    marker.bindPopup("", { minWidth: 290, maxWidth: 330, autoPanPadding: [40, 40] });

    // El contenido se construye cada vez que se abre el popup (siempre inicia en modo "ver")
    marker.on("popupopen", (event) => {
      const popup = event.popup;
      selectedId.value = point.id;

      popup.setContent(pointPopup({
        point,
        categories: categories.value,
        onUpdate: updatePoint,
        onDelete: deletePoint,
        // Al cambiar entre ver / editar, el popup se reacomoda dentro del mapa
        onResize: () => requestAnimationFrame(() => {
          if (popup.isOpen()) {
            popup.update();
            popup._adjustPan?.();
          }
        })
      }));
    });
    marker.addTo(pointsLayer);
    markers.set(point.id, marker);
  });
}

function openNewPointPopup(latlng) {
  if (categories.value.length === 0) {
    toast.error("No hay categorías cargadas. Ejecuta el seed del backend.");
    return;
  }

  L.popup({ minWidth: 290, maxWidth: 330, autoPanPadding: [40, 40] })
    .setLatLng(latlng)
    .setContent(newPointPopup({
      latlng,
      categories: categories.value,
      onSave: createPoint,
      onCancel: () => map.closePopup()
    }))
    .openOn(map);
}

async function createPoint(data) {
  const response = await api.createPoint(data);
  toast.success(response.message);
  map.closePopup();
  await refreshAll();

  if (!openPointPopup(response.data.id)) {
    toast.info("El punto se guardó, pero no coincide con los filtros actuales.");
  }
}

async function updatePoint(id, data) {
  const response = await api.updatePoint(id, data);
  toast.success(response.message);
  map.closePopup();
  await refreshAll();
  openPointPopup(id);
}

async function deletePoint(point) {
  const ok = await confirm.ask({
    title: "Eliminar punto de ayuda",
    message: `Se eliminará "${point.name}" del mapa y de la base de datos.`
  });
  if (!ok) return;

  try {
    const response = await api.deletePoint(point.id);
    toast.success(response.message);
    map.closePopup();
    if (selectedId.value === point.id) selectedId.value = "";
    await refreshAll();
  } catch (error) {
    toast.error(error.fullMessage || error.message);
  }
}

function openPointPopup(id) {
  const marker = markers.get(id);
  if (!marker) return false;
  marker.openPopup();
  return true;
}

// Clic en una fila de la tabla
function selectPoint(point) {
  selectedId.value = point.id;
  const marker = markers.get(point.id);
  if (!marker) return;

  mapEl.value.scrollIntoView({ behavior: "smooth", block: "center" });
  map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 16), { duration: 0.6 });
  map.once("moveend", () => marker.openPopup());
}

// ---------- Zonas (polígonos) ----------
function renderZones() {
  zonesLayer.clearLayers();

  zones.value.forEach((zone) => {
    const polygon = L.polygon(ringToLatLngs(zone.area.coordinates[0]), {
      color: zone.color,
      weight: 2,
      fillOpacity: filters.zone === zone.id ? 0.22 : 0.1,
      dashArray: filters.zone === zone.id ? null : "6 4",
      bubblingMouseEvents: false // el clic en la zona no crea un punto
    });

    polygon.bindTooltip(zone.name, { sticky: true, direction: "top" });

    polygon.on("click", (event) => {
      if (map.pm.globalEditModeEnabled()) return;

      L.popup({ minWidth: 240 })
        .setLatLng(event.latlng)
        .setContent(zonePopup({
          zone,
          onFilter: filterByZone,
          onDelete: deleteZone,
          onAddPoint: () => openNewPointPopup(event.latlng)
        }))
        .openOn(map);
    });

    // Al mover vértices con el lápiz de Geoman se guardan los cambios
    polygon.on("pm:edit", () => saveZoneGeometry(zone, polygon));

    polygon.addTo(zonesLayer);
  });
}

async function saveZoneGeometry(zone, polygon) {
  try {
    await api.updateZone(zone.id, { coordinates: polygon.toGeoJSON().geometry.coordinates });
    toast.success(`Zona "${zone.name}" actualizada.`);
    await refreshAll();
  } catch (error) {
    toast.error(error.fullMessage || error.message);
    await loadZones();
  }
}

// Geoman terminó de dibujar un polígono -> se pide el nombre
function handleZoneDrawn({ layer }) {
  pendingZoneLayer = layer;
  Object.assign(zoneForm, { name: "", description: "", color: "#7c3aed", saving: false, error: "" });
  zoneModalOpen.value = true;
}

function cancelZone() {
  if (pendingZoneLayer) map.removeLayer(pendingZoneLayer);
  pendingZoneLayer = null;
  zoneModalOpen.value = false;
}

async function saveZone() {
  if (zoneForm.name.trim().length < 3) {
    zoneForm.error = "El nombre de la zona debe tener al menos 3 caracteres.";
    return;
  }

  zoneForm.saving = true;
  zoneForm.error = "";

  try {
    // toGeoJSON() ya regresa las coordenadas en orden [longitud, latitud]
    const coordinates = pendingZoneLayer.toGeoJSON().geometry.coordinates;

    const response = await api.createZone({
      name: zoneForm.name.trim(),
      description: zoneForm.description.trim(),
      color: zoneForm.color,
      coordinates
    });

    map.removeLayer(pendingZoneLayer);
    pendingZoneLayer = null;
    zoneModalOpen.value = false;
    toast.success(response.message);
    await loadZones();
  } catch (error) {
    zoneForm.error = error.fullMessage || error.message;
  } finally {
    zoneForm.saving = false;
  }
}

async function deleteZone(zone) {
  const ok = await confirm.ask({
    title: "Eliminar zona",
    message: `Se eliminará la zona "${zone.name}". Los puntos de ayuda no se borran.`
  });
  if (!ok) return;

  try {
    const response = await api.deleteZone(zone.id);
    toast.success(response.message);
    map.closePopup();
    if (filters.zone === zone.id) filters.zone = "all";
    await loadZones();
  } catch (error) {
    toast.error(error.fullMessage || error.message);
  }
}

function focusZone(zone) {
  const bounds = L.latLngBounds(ringToLatLngs(zone.area.coordinates[0]));
  map.flyToBounds(bounds, { padding: [30, 30], duration: 0.6 });
}

function filterByZone(zone) {
  map.closePopup();
  filters.zone = zone.id;
  focusZone(zone);
}

function resetFilters() {
  Object.assign(filters, { search: "", category: "all", status: "all", zone: "all" });
}

// ---------- Filtros: se piden al backend cada vez que cambian ----------
let searchTimer = null;
watch(() => filters.search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadPoints, 350);
});
watch(() => [filters.category, filters.status], loadPoints);
watch(() => filters.zone, () => {
  loadPoints();
  renderZones();
});

// ---------- Ciclo de vida ----------
onMounted(async () => {
  map = createBaseMap(mapEl.value);
  zonesLayer = L.featureGroup().addTo(map);
  pointsLayer = L.featureGroup().addTo(map);

  // Barra de Geoman para dibujar zonas
  map.pm.setLang("es");
  map.pm.addControls({
    position: "topleft",
    drawMarker: false,
    drawCircleMarker: false,
    drawPolyline: false,
    drawCircle: false,
    drawText: false,
    drawPolygon: true,
    drawRectangle: true,
    editMode: true,
    dragMode: false,
    cutPolygon: false,
    removalMode: false,
    rotateMode: false
  });
  map.pm.setPathOptions({ color: "#7c3aed", fillOpacity: 0.15 });

  map.on("pm:create", handleZoneDrawn);

  // Clic en el mapa = registrar un punto nuevo
  map.on("click", (event) => {
    if (map.pm.globalDrawModeEnabled() || map.pm.globalEditModeEnabled()) return;
    openNewPointPopup(event.latlng);
  });

  await nextTick();
  map.invalidateSize();

  try {
    await loadCategories();
  } catch (error) {
    toast.error(error.fullMessage || error.message);
  }
  await refreshAll();

  // Llegó desde el directorio con ?focus=<id>
  if (route.query.focus) {
    const point = points.value.find((p) => p.id === route.query.focus);
    if (point) selectPoint(point);
  }
});

onBeforeUnmount(() => {
  clearTimeout(searchTimer);
  map?.remove();
  map = null;
});
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Mapa de puntos de ayuda</h1>
        <p class="muted">
          Haz <strong>clic en el mapa</strong> para registrar un punto. Abre un marcador para editarlo o eliminarlo.
        </p>
      </div>
      <ul class="legend">
        <li v-for="c in categories" :key="c.id">
          <span class="legend-dot" :style="{ '--marker-color': c.color }">{{ c.icon }}</span>{{ c.name }}
        </li>
      </ul>
    </div>

    <div class="map-layout">
      <div class="card map-card">
        <div ref="mapEl" class="map"></div>
      </div>

      <aside class="side-panel">
        <PointFilters
          v-model="filters"
          :categories="categories"
          :zones="zones"
          :total="points.length"
          :loading="loading"
          @reset="resetFilters"
        />
        <ZonesPanel
          :zones="zones"
          :active-zone="filters.zone"
          @focus="focusZone"
          @filter="filterByZone"
          @delete="deleteZone"
        />
      </aside>
    </div>

    <HelpPointsTable :points="points" :selected-id="selectedId" @select="selectPoint" />

    <ModalDialog v-if="zoneModalOpen" title="Guardar nueva zona" @close="cancelZone">
      <form class="form-grid" @submit.prevent="saveZone">
        <label class="field field--wide">
          <span>Nombre de la zona *</span>
          <input v-model="zoneForm.name" maxlength="80" placeholder="Ej. Zona Centro" autofocus />
        </label>
        <label class="field field--wide">
          <span>Descripción</span>
          <input v-model="zoneForm.description" maxlength="200" placeholder="Opcional" />
        </label>
        <label class="field">
          <span>Color</span>
          <input v-model="zoneForm.color" type="color" />
        </label>
        <p v-if="zoneForm.error" class="alert alert--error field--wide">{{ zoneForm.error }}</p>
        <div class="modal-actions field--wide">
          <button type="button" class="btn btn-ghost" @click="cancelZone">Descartar</button>
          <button type="submit" class="btn btn-primary" :disabled="zoneForm.saving">
            {{ zoneForm.saving ? "Guardando…" : "Guardar zona" }}
          </button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>
