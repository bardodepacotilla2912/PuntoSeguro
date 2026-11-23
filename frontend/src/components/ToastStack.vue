<script setup>
import { useToast } from "../composables/useToast";

const { toasts, dismiss } = useToast();
const icons = { success: "✅", error: "⚠️", info: "ℹ️" };
</script>

<template>
  <div class="toast-stack" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', `toast--${toast.type}`]" role="status">
        <span>{{ icons[toast.type] }}</span>
        <p>{{ toast.message }}</p>
        <button type="button" aria-label="Cerrar" @click="dismiss(toast.id)">×</button>
      </div>
    </TransitionGroup>
  </div>
</template>
