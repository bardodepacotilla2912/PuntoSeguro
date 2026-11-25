<script setup>
import { ref } from "vue";

import HospitalsCrud from "../components/HospitalsCrud.vue";
import FireStationsCrud from "../components/FireStationsCrud.vue";
import PoliceStationsCrud from "../components/PoliceStationsCrud.vue";
import PharmaciesCrud from "../components/PharmaciesCrud.vue";

// Pestaña seleccionada
const activeTab = ref("hospitals");
</script>

<template>
  <div class="page">
    <h1>Directorio de ayuda</h1>
    <p class="muted">Información de contacto de hospitales, bomberos, policía y farmacias.</p>

    <div class="tabs">
      <button type="button" :class="{ active: activeTab === 'hospitals' }" @click="activeTab = 'hospitals'">
        Hospitales
      </button>
      <button type="button" :class="{ active: activeTab === 'fire' }" @click="activeTab = 'fire'">
        Bomberos
      </button>
      <button type="button" :class="{ active: activeTab === 'police' }" @click="activeTab = 'police'">
        Policía
      </button>
      <button type="button" :class="{ active: activeTab === 'pharmacies' }" @click="activeTab = 'pharmacies'">
        Farmacias
      </button>
    </div>

    <HospitalsCrud v-if="activeTab === 'hospitals'" />
    <FireStationsCrud v-if="activeTab === 'fire'" />
    <PoliceStationsCrud v-if="activeTab === 'police'" />
    <PharmaciesCrud v-if="activeTab === 'pharmacies'" />
  </div>
</template>
