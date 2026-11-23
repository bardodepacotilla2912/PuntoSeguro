<script setup>
import { useConfirm } from "../composables/useConfirm";

const { state, answer } = useConfirm();
</script>

<template>
  <div v-if="state.open" class="modal-backdrop" @click.self="answer(false)">
    <div class="modal modal--sm" role="alertdialog" aria-modal="true">
      <h2 class="modal-title">{{ state.title }}</h2>
      <p class="modal-text">{{ state.message }}</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" @click="answer(false)">Cancelar</button>
        <button type="button" class="btn btn-danger" @click="answer(true)">{{ state.confirmText }}</button>
      </div>
    </div>
  </div>
</template>
