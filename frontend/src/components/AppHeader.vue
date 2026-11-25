<script setup>
import { useRouter } from "vue-router";
import { session } from "../stores/session";

const router = useRouter();

function logout() {
  session.user = null;
  router.push("/login");
}
</script>

<template>
  <header class="app-header">
    <span class="brand">Punto<strong>Seguro</strong></span>

    <nav class="app-nav">
      <RouterLink to="/mapa">Mapa</RouterLink>
      <RouterLink to="/cercano">Más cercano</RouterLink>
      <RouterLink to="/directorio">Directorio</RouterLink>
    </nav>

    <div class="user-box">
      <span>{{ session.user.name }}</span>
      <button type="button" class="btn btn-light" @click="logout">Cerrar sesión</button>
    </div>
  </header>
</template>
