<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

import { auth } from "../stores/auth";
import { useToast } from "../composables/useToast";

const router = useRouter();
const toast = useToast();
const menuOpen = ref(false);

function logout() {
  auth.clearSession();
  toast.info("Cerraste sesión.");
  router.push({ name: "login" });
}
</script>

<template>
  <header class="app-header">
    <RouterLink to="/mapa" class="brand">
      <img src="/favicon.svg" alt="" width="28" height="28" />
      <span>Punto<strong>Seguro</strong></span>
    </RouterLink>

    <button class="menu-toggle" type="button" aria-label="Abrir menú" @click="menuOpen = !menuOpen">☰</button>

    <nav :class="['app-nav', { 'is-open': menuOpen }]" @click="menuOpen = false">
      <RouterLink to="/mapa">🗺️ Mapa</RouterLink>
      <RouterLink to="/cercano">🧭 Más cercano</RouterLink>
      <RouterLink to="/directorio">📇 Directorio</RouterLink>
    </nav>

    <div class="user-box">
      <span class="user-name" :title="auth.state.user?.email">👤 {{ auth.state.user?.name }}</span>
      <button type="button" class="btn btn-ghost btn-sm" @click="logout">Cerrar sesión</button>
    </div>
  </header>
</template>
