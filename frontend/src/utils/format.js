// Funciones de formato que usan varias vistas

export const POINT_STATUS_LABELS = {
  activo: "Activo",
  inactivo: "Inactivo"
};

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

export function formatDistance(meters) {
  if (meters === undefined || meters === null) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
}

export function formatCoord(value) {
  return Number(value).toFixed(5);
}

// Convierte un texto con underscores en etiqueta legible: "en_servicio" -> "En servicio"
export function humanize(value) {
  if (!value) return "—";
  const text = String(value).replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Escapa HTML para insertar texto de la BD dentro de popups de Leaflet
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
