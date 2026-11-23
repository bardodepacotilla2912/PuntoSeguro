import { reactive, computed } from "vue";

// Estado global de la sesión (token + usuario).
// Se guarda en localStorage para no perder la sesión al recargar.
const STORAGE_KEY = "puntoseguro.session";

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const saved = readSession();

const state = reactive({
  token: saved?.token || "",
  user: saved?.user || null
});

function setSession({ token, user }) {
  state.token = token;
  state.user = user;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
  } catch {
    // Si el navegador bloquea localStorage, la sesión dura solo mientras la pestaña esté abierta
  }
}

function clearSession() {
  state.token = "";
  state.user = null;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nada que hacer
  }
}

export const auth = {
  state,
  isAuthenticated: computed(() => Boolean(state.token)),
  setSession,
  clearSession
};
