<script setup>
import { reactive, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import { api } from "../services/api";
import { auth } from "../stores/auth";
import { useToast } from "../composables/useToast";

const router = useRouter();
const route = useRoute();
const toast = useToast();

const mode = ref("login"); // "login" | "register"
const loading = ref(false);
const errorMessage = ref("");
const errorDetails = ref([]);

const form = reactive({
  name: "",
  email: "",
  password: "",
  confirm: ""
});

onMounted(() => {
  if (route.query.expired) {
    errorMessage.value = "Tu sesión expiró. Inicia sesión de nuevo.";
  }
});

function switchMode(next) {
  mode.value = next;
  errorMessage.value = "";
  errorDetails.value = [];
}

// Validación en el navegador (el backend vuelve a validar)
function validate() {
  const errors = [];
  const email = form.email.trim();

  if (mode.value === "register" && form.name.trim().length < 3) {
    errors.push("El nombre debe tener al menos 3 caracteres.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.push("Escribe un correo válido.");
  }
  if (!form.password) {
    errors.push("Escribe tu contraseña.");
  }
  if (mode.value === "register") {
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      errors.push("La contraseña debe tener al menos 8 caracteres, con letras y números.");
    }
    if (form.password !== form.confirm) {
      errors.push("Las contraseñas no coinciden.");
    }
  }
  return errors;
}

async function submit() {
  errorMessage.value = "";
  errorDetails.value = [];

  const errors = validate();
  if (errors.length > 0) {
    errorMessage.value = "Revisa los datos del formulario";
    errorDetails.value = errors;
    return;
  }

  loading.value = true;

  try {
    const body = { email: form.email.trim(), password: form.password };
    const response = mode.value === "login"
      ? await api.login(body)
      : await api.register({ ...body, name: form.name.trim() });

    auth.setSession(response.data);
    toast.success(mode.value === "login"
      ? `¡Bienvenido, ${response.data.user.name}!`
      : "Cuenta creada correctamente. ¡Bienvenido!");

    router.push(route.query.redirect || "/mapa");
  } catch (error) {
    errorMessage.value = error.message;
    errorDetails.value = Array.isArray(error.details) ? error.details : [];
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <section class="auth-hero">
      <div class="auth-hero__brand">
        <img src="/favicon.svg" alt="" width="44" height="44" />
        <h1>Punto<strong>Seguro</strong></h1>
      </div>
      <p class="auth-hero__lead">Red de puntos de ayuda de León, Guanajuato.</p>
      <ul class="auth-hero__list">
        <li>🏥 Hospitales y Cruz Roja</li>
        <li>🚒 Estaciones de bomberos</li>
        <li>🚓 Módulos de policía</li>
        <li>💊 Farmacias participantes</li>
      </ul>
      <p class="auth-hero__foot">Encuentra el punto de ayuda más cercano, su contacto y la ruta para llegar.</p>
      <p class="auth-hero__emergency">En una emergencia real llama al <strong>911</strong>.</p>
    </section>

    <section class="auth-card card">
      <div class="tabs" role="tablist">
        <button type="button" role="tab" :class="{ 'is-active': mode === 'login' }" @click="switchMode('login')">
          Iniciar sesión
        </button>
        <button type="button" role="tab" :class="{ 'is-active': mode === 'register' }" @click="switchMode('register')">
          Crear cuenta
        </button>
      </div>

      <form class="auth-form" novalidate @submit.prevent="submit">
        <label v-if="mode === 'register'" class="field">
          <span>Nombre completo</span>
          <input v-model="form.name" type="text" autocomplete="name" maxlength="80" placeholder="Tu nombre" />
        </label>

        <label class="field">
          <span>Correo electrónico</span>
          <input v-model="form.email" type="email" autocomplete="email" maxlength="120" placeholder="correo@ejemplo.com" />
        </label>

        <label class="field">
          <span>Contraseña</span>
          <input
            v-model="form.password"
            type="password"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            maxlength="72"
            placeholder="••••••••"
          />
        </label>

        <label v-if="mode === 'register'" class="field">
          <span>Confirmar contraseña</span>
          <input v-model="form.confirm" type="password" autocomplete="new-password" maxlength="72" placeholder="••••••••" />
          <small class="muted">Mínimo 8 caracteres, con letras y números.</small>
        </label>

        <div v-if="errorMessage" class="alert alert--error" role="alert">
          <strong>{{ errorMessage }}</strong>
          <ul v-if="errorDetails.length">
            <li v-for="detail in errorDetails" :key="detail">{{ detail }}</li>
          </ul>
        </div>

        <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="loading">
          {{ loading ? "Un momento…" : mode === "login" ? "Entrar" : "Crear cuenta" }}
        </button>
      </form>
    </section>
  </div>
</template>
