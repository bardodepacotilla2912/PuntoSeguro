<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";

import { login, register } from "../services/api";
import { session } from "../stores/session";
import { validatePersonName, validateEmail, validatePassword } from "../utils/validations";

const router = useRouter();

// "login" o "register"
const mode = ref("login");
const errorMessage = ref("");

const form = reactive({
  name: "",
  email: "",
  password: ""
});

function changeMode(newMode) {
  mode.value = newMode;
  errorMessage.value = "";
}

// Revisa los campos; en el login solo se pide correo y contraseña
function validateForm() {
  if (mode.value === "login") {
    if (validateEmail(form.email)) {
      return validateEmail(form.email);
    }
    if (form.password === "") {
      return "Escribe tu contraseña.";
    }
    return "";
  }

  return (
    validatePersonName(form.name) ||
    validateEmail(form.email) ||
    validatePassword(form.password)
  );
}

async function submitForm() {
  errorMessage.value = validateForm();

  if (errorMessage.value) {
    return;
  }

  try {
    let response;

    if (mode.value === "login") {
      response = await login({ email: form.email, password: form.password });
    } else {
      response = await register({ name: form.name, email: form.email, password: form.password });
    }

    // Se guarda el usuario y se entra a la vista principal
    session.user = response.data;
    router.push("/mapa");
  } catch (error) {
    errorMessage.value = error.message;
  }
}
</script>

<template>
  <div class="login-page">
    <section class="login-card card">
      <h1>Punto<strong>Seguro</strong></h1>
      <p class="muted">Red de puntos de ayuda de León, Guanajuato.</p>

      <div class="tabs">
        <button type="button" :class="{ active: mode === 'login' }" @click="changeMode('login')">
          Iniciar sesión
        </button>
        <button type="button" :class="{ active: mode === 'register' }" @click="changeMode('register')">
          Crear cuenta
        </button>
      </div>

      <form @submit.prevent="submitForm">
        <label v-if="mode === 'register'">
          Nombre
          <input v-model="form.name" type="text" placeholder="Tu nombre" />
        </label>

        <label>
          Correo electrónico
          <input v-model="form.email" type="email" placeholder="correo@ejemplo.com" />
        </label>

        <label>
          Contraseña
          <input v-model="form.password" type="password" placeholder="Mínimo 8 caracteres" />
        </label>

        <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

        <button type="submit" class="btn btn-primary btn-block">
          {{ mode === "login" ? "Entrar" : "Crear cuenta" }}
        </button>
      </form>
    </section>
  </div>
</template>
