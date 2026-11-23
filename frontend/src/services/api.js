import { auth } from "../stores/auth";

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

// Error con el mensaje y los detalles que regresa el backend
export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }

  // Texto listo para mostrar en un mensaje
  get fullMessage() {
    if (Array.isArray(this.details) && this.details.length > 0) {
      return `${this.message}: ${this.details.join(" ")}`;
    }
    return this.message;
  }
}

// Se llama cuando el backend responde 401 (token vencido / inválido)
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      search.set(key, value);
    }
  });

  const text = search.toString();
  return text ? `?${text}` : "";
}

export async function request(path, { method = "GET", body, query } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth.state.token) {
    headers.Authorization = `Bearer ${auth.state.token}`;
  }

  let response;

  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor. Revisa que la API esté encendida.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = data?.error || {};

    if (response.status === 401 && auth.state.token) {
      onUnauthorized();
    }

    throw new ApiError(response.status, error.message || "Ocurrió un error inesperado", error.details);
  }

  return data;
}

// Atajos por recurso
export const api = {
  // Autenticación
  login: (body) => request("/auth/login", { method: "POST", body }),
  register: (body) => request("/auth/register", { method: "POST", body }),
  me: () => request("/auth/me"),

  // Catálogo
  categories: () => request("/categories"),

  // Puntos de ayuda (ubicaciones)
  listPoints: (filters) => request("/help-points", { query: filters }),
  nearestPoints: (params) => request("/help-points/nearest", { query: params }),
  createPoint: (body) => request("/help-points", { method: "POST", body }),
  updatePoint: (id, body) => request(`/help-points/${id}`, { method: "PATCH", body }),
  deletePoint: (id) => request(`/help-points/${id}`, { method: "DELETE" }),

  // Zonas
  listZones: () => request("/zones"),
  createZone: (body) => request("/zones", { method: "POST", body }),
  updateZone: (id, body) => request(`/zones/${id}`, { method: "PATCH", body }),
  deleteZone: (id) => request(`/zones/${id}`, { method: "DELETE" }),

  // Directorio (hospitales, bomberos, policía, farmacias)
  listDirectory: (endpoint, filters) => request(`/${endpoint}`, { query: filters }),
  createDirectory: (endpoint, body) => request(`/${endpoint}`, { method: "POST", body }),
  updateDirectory: (endpoint, id, body) => request(`/${endpoint}/${id}`, { method: "PATCH", body }),
  deleteDirectory: (endpoint, id) => request(`/${endpoint}/${id}`, { method: "DELETE" })
};
