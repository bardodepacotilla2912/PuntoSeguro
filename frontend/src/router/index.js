import { createRouter, createWebHistory } from "vue-router";

import { session } from "../stores/session";

import LoginView from "../views/LoginView.vue";
import MapView from "../views/MapView.vue";
import NearestView from "../views/NearestView.vue";
import DirectoryView from "../views/DirectoryView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/mapa" },
    { path: "/login", name: "login", component: LoginView },
    { path: "/mapa", name: "map", component: MapView },
    { path: "/cercano", name: "nearest", component: NearestView },
    { path: "/directorio", name: "directory", component: DirectoryView }
  ]
});

// Sin iniciar sesión no se puede entrar a las vistas internas
router.beforeEach((to) => {
  if (to.name !== "login" && !session.user) {
    return { name: "login" };
  }
});

export default router;
