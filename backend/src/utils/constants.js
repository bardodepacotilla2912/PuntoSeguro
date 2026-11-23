"use strict";

// Valores permitidos que comparten modelos y validadores.
// Se definen en un solo lugar para no repetirlos.

// Categorías de los puntos de ayuda (se guardan en la colección categories)
const CATEGORY_SLUGS = ["hospital", "bomberos", "policia", "farmacia"];

// Estado de un punto de ayuda en el mapa
const HELP_POINT_STATUSES = ["activo", "inactivo"];

// Directorio: hospitales
const HOSPITAL_TYPES = ["hospital", "clinica", "cruz_roja"];
const HOSPITAL_STATUSES = ["operando", "saturado", "cerrado"];

// Directorio: estaciones de bomberos
const FIRE_STATION_STATUSES = ["activa", "en_servicio", "fuera_de_servicio"];

// Directorio: policía
const POLICE_TYPES = ["modulo", "estacion", "comandancia"];
const POLICE_STATUSES = ["activo", "inactivo"];

// Directorio: farmacias
const PHARMACY_STATUSES = ["abierta", "cerrada"];

module.exports = {
    CATEGORY_SLUGS,
    HELP_POINT_STATUSES,
    HOSPITAL_TYPES,
    HOSPITAL_STATUSES,
    FIRE_STATION_STATUSES,
    POLICE_TYPES,
    POLICE_STATUSES,
    PHARMACY_STATUSES
};
