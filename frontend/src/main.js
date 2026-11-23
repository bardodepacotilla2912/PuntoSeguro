import { createApp } from "vue";

import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "./style.css";

import App from "./App.vue";
import router from "./router";

createApp(App).use(router).mount("#app");
