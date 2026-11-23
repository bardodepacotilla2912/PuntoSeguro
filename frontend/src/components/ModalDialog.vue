<script setup>
defineProps({
  title: { type: String, required: true },
  wide: { type: Boolean, default: false }
});

const emit = defineEmits(["close"]);
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div :class="['modal', { 'modal--wide': wide }]" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2 class="modal-title">{{ title }}</h2>
        <button type="button" class="icon-btn" aria-label="Cerrar" @click="emit('close')">×</button>
      </div>
      <slot />
    </div>
  </div>
</template>
