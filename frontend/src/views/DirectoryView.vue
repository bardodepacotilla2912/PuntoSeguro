<script setup>
import { ref, computed, onMounted } from "vue";

import { api } from "../services/api";
import { useToast } from "../composables/useToast";
import { DIRECTORY_ENTITIES } from "../config/directory";
import DirectoryCrud from "../components/DirectoryCrud.vue";

const toast = useToast();

const activeKey = ref(DIRECTORY_ENTITIES[0].key);
const categories = ref([]);

const activeEntity = computed(() => DIRECTORY_ENTITIES.find((e) => e.key === activeKey.value));

onMounted(async () => {
  try {
    categories.value = (await api.categories()).data;
  } catch (error) {
    toast.error(error.fullMessage || error.message);
  }
});
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Directorio de ayuda</h1>
        <p class="muted">
          Información de contacto de hospitales, bomberos, policía y farmacias.
          Cada registro puede vincularse a su punto en el mapa.
        </p>
      </div>
    </div>

    <div class="tabs tabs--pills" role="tablist">
      <button
        v-for="entity in DIRECTORY_ENTITIES"
        :key="entity.key"
        type="button"
        role="tab"
        :class="{ 'is-active': activeKey === entity.key }"
        @click="activeKey = entity.key"
      >
        {{ entity.icon }} {{ entity.title }}
      </button>
    </div>

    <DirectoryCrud :key="activeEntity.key" :entity="activeEntity" :categories="categories" />
  </div>
</template>
