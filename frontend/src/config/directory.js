// Configuración de las 4 entidades del directorio.
// El componente DirectoryCrud usa esto para pintar la tabla y el formulario.

const commonFields = (statuses) => [
  { key: "name", label: "Nombre", type: "text", required: true, maxlength: 100 },
  { key: "phone", label: "Teléfono", type: "tel", required: true, maxlength: 30 },
  { key: "address", label: "Dirección", type: "text", required: true, maxlength: 200, wide: true },
  { key: "status", label: "Estado", type: "select", required: true, options: statuses }
];

export const DIRECTORY_ENTITIES = [
  {
    key: "hospitals",
    endpoint: "hospitals",
    title: "Hospitales",
    singular: "hospital",
    newLabel: "Nuevo hospital",
    icon: "🏥",
    categorySlug: "hospital",
    statuses: ["operando", "saturado", "cerrado"],
    fields: [
      ...commonFields(["operando", "saturado", "cerrado"]),
      { key: "type", label: "Tipo", type: "select", required: true, options: ["hospital", "clinica", "cruz_roja"] },
      { key: "emergencyPhone", label: "Tel. urgencias", type: "tel", maxlength: 30 },
      { key: "beds", label: "Camas", type: "number", min: 0 },
      { key: "specialties", label: "Especialidades (separadas por coma)", type: "tags", wide: true },
      { key: "is24h", label: "Abierto 24 horas", type: "checkbox" }
    ],
    columns: ["name", "type", "status", "phone", "emergencyPhone", "beds", "is24h"]
  },
  {
    key: "fire-stations",
    endpoint: "fire-stations",
    title: "Bomberos",
    singular: "estación de bomberos",
    newLabel: "Nueva estación",
    icon: "🚒",
    categorySlug: "bomberos",
    statuses: ["activa", "en_servicio", "fuera_de_servicio"],
    fields: [
      ...commonFields(["activa", "en_servicio", "fuera_de_servicio"]),
      { key: "units", label: "Unidades", type: "number", min: 0 },
      { key: "chief", label: "Responsable", type: "text", maxlength: 100 }
    ],
    columns: ["name", "status", "phone", "units", "chief"]
  },
  {
    key: "police-stations",
    endpoint: "police-stations",
    title: "Policía",
    singular: "módulo de policía",
    newLabel: "Nuevo módulo",
    icon: "🚓",
    categorySlug: "policia",
    statuses: ["activo", "inactivo"],
    fields: [
      ...commonFields(["activo", "inactivo"]),
      { key: "type", label: "Tipo", type: "select", required: true, options: ["modulo", "estacion", "comandancia"] },
      { key: "sector", label: "Sector", type: "text", maxlength: 60 },
      { key: "officers", label: "Elementos", type: "number", min: 0 }
    ],
    columns: ["name", "type", "status", "phone", "sector", "officers"]
  },
  {
    key: "pharmacies",
    endpoint: "pharmacies",
    title: "Farmacias",
    singular: "farmacia",
    newLabel: "Nueva farmacia",
    icon: "💊",
    categorySlug: "farmacia",
    statuses: ["abierta", "cerrada"],
    fields: [
      ...commonFields(["abierta", "cerrada"]),
      { key: "chain", label: "Cadena", type: "text", maxlength: 60 },
      { key: "is24h", label: "Abierta 24 horas", type: "checkbox" },
      { key: "delivery", label: "Servicio a domicilio", type: "checkbox" }
    ],
    columns: ["name", "status", "phone", "chain", "is24h", "delivery"]
  }
];

// Etiquetas de columnas que no están en fields
export const COLUMN_LABELS = {
  name: "Nombre",
  type: "Tipo",
  status: "Estado",
  phone: "Teléfono",
  emergencyPhone: "Urgencias",
  beds: "Camas",
  is24h: "24 h",
  units: "Unidades",
  chief: "Responsable",
  sector: "Sector",
  officers: "Elementos",
  chain: "Cadena",
  delivery: "A domicilio"
};
