import { createRouter, createWebHistory } from "vue-router";

import { auth } from "../stores/auth";
import { setUnauthorizedHandler } from "../services/api";

import LoginView from "../views/LoginView.vue";
import MapView from "../views/MapView.vue";
import NearestView from "../views/NearestView.vue";
import DirectoryView from "../views/DirectoryView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/mapa" },
    { path: "/login", name: "login", component: LoginView, meta: { public: true, title: "Acceso" } },
    { path: "/mapa", name: "map", component: MapView, meta: { title: "Mapa de puntos" } },
    { path: "/cercano", name: "nearest", component: NearestView, meta: { title: "Punto más cercano" } },
    { path: "/directorio", name: "directory", component: DirectoryView, meta: { title: "Directorio" } },
    { path: "/:pathMatch(.*)*", redirect: "/mapa" }
  ]
});

// Sin sesión no se puede entrar a las vistas internas
router.beforeEach((to) => {
  if (!to.meta.public && !auth.isAuthenticated.value) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (to.name === "login" && auth.isAuthenticated.value) {
    return { name: "map" };
  }

  return true;
});

router.afterEach((to) => {
  document.title = `${to.meta.title || "PuntoSeguro"} · PuntoSeguro`;
});

// Si el backend responde 401, se cierra la sesión y se manda al login
setUnauthorizedHandler(() => {
  auth.clearSession();
  router.push({ name: "login", query: { expired: "1" } });
});

export default router;
