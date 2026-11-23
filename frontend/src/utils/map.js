import L from "leaflet";
import { escapeHtml } from "./format";

// Centro de León, Guanajuato
export const LEON_CENTER = [21.1250, -101.6860];
export const DEFAULT_ZOOM = 13;

// Crea un mapa base con OpenStreetMap
export function createBaseMap(element, options = {}) {
  const map = L.map(element, {
    center: options.center || LEON_CENTER,
    zoom: options.zoom || DEFAULT_ZOOM,
    zoomControl: true
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  return map;
}

// Ícono circular con el color y emoji de la categoría
export function categoryIcon(category, { inactive = false, highlight = false } = {}) {
  const color = inactive ? "#9ca3af" : category?.color || "#2563eb";
  const icon = escapeHtml(category?.icon || "📍");

  return L.divIcon({
    className: "ps-marker-wrapper",
    html: `<div class="ps-marker${highlight ? " is-highlight" : ""}" style="--marker-color:${color}">
             <span>${icon}</span>
           </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32]
  });
}

// Ícono de "Tú estás aquí"
export function originIcon() {
  return L.divIcon({
    className: "ps-marker-wrapper",
    html: '<div class="ps-origin"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
}

// GeoJSON [lng, lat] -> Leaflet [lat, lng]
export function toLatLng([lng, lat]) {
  return [lat, lng];
}

// Anillo GeoJSON -> lista de vértices de Leaflet (sin el vértice de cierre)
export function ringToLatLngs(ring) {
  const latlngs = ring.map(toLatLng);
  const first = latlngs[0];
  const last = latlngs[latlngs.length - 1];

  if (first && last && first[0] === last[0] && first[1] === last[1]) {
    latlngs.pop();
  }

  return latlngs;
}
