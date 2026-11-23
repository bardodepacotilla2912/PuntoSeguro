<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

import AppHeader from "./components/AppHeader.vue";
import ToastStack from "./components/ToastStack.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";

const route = useRoute();
const showHeader = computed(() => !route.meta.public);
</script>

<template>
  <AppHeader v-if="showHeader" />
  <main :class="showHeader ? 'app-main' : 'app-main app-main--bare'">
    <RouterView />
  </main>
  <ToastStack />
  <ConfirmDialog />
</template>
