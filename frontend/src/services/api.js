// URL de la API. En producción se cambia en el archivo .env (VITE_API_URL)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Hace la petición y, si el backend responde con error, lanza el mensaje
async function request(path, method = "GET", body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(API_URL + path, options);
  const data = await response.json();

  if (!response.ok) {
    let message = data.error.message;

    if (data.error.details) {
      message += ": " + data.error.details.join(" ");
    }

    throw new Error(message);
  }

  return data;
}

// Arma el query string sin los filtros vacíos o en "all"
function buildQuery(filters) {
  const params = new URLSearchParams();

  for (const key in filters) {
    if (filters[key] !== "" && filters[key] !== "all") {
      params.append(key, filters[key]);
    }
  }

  return params.toString();
}

// ---------- Usuarios ----------
export function login(data) {
  return request("/auth/login", "POST", data);
}

export function register(data) {
  return request("/auth/register", "POST", data);
}

// ---------- Categorías ----------
export function getCategories() {
  return request("/categories");
}

// ---------- Puntos de ayuda ----------
export function getHelpPoints(filters) {
  return request("/help-points?" + buildQuery(filters));
}

export function getNearestPoints(filters) {
  return request("/help-points/nearest?" + buildQuery(filters));
}

export function createHelpPoint(data) {
  return request("/help-points", "POST", data);
}

export function updateHelpPoint(id, data) {
  return request(`/help-points/${id}`, "PATCH", data);
}

export function deleteHelpPoint(id) {
  return request(`/help-points/${id}`, "DELETE");
}

// ---------- Zonas ----------
export function getZones() {
  return request("/zones");
}

export function createZone(data) {
  return request("/zones", "POST", data);
}

export function deleteZone(id) {
  return request(`/zones/${id}`, "DELETE");
}

// ---------- Directorio (hospitales, bomberos, policía, farmacias) ----------
// resource = "hospitals" | "fire-stations" | "police-stations" | "pharmacies"
export function getItems(resource, filters) {
  return request(`/${resource}?` + buildQuery(filters));
}

export function createItem(resource, data) {
  return request(`/${resource}`, "POST", data);
}

export function updateItem(resource, id, data) {
  return request(`/${resource}/${id}`, "PATCH", data);
}

export function deleteItem(resource, id) {
  return request(`/${resource}/${id}`, "DELETE");
}
