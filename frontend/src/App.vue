<script setup>
import { session } from "./stores/session";
import AppHeader from "./components/AppHeader.vue";
</script>

<template>
  <AppHeader v-if="session.user" />
  <main :class="session.user ? 'app-main' : ''">
    <RouterView />
  </main>
</template>
