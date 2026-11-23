// Cálculo de rutas con el servicio público de OSRM (OpenStreetMap)
// Documentación: https://project-osrm.org/docs/v5.24.0/api/#route-service

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

const MODIFIERS = {
  left: "a la izquierda",
  right: "a la derecha",
  "slight left": "ligeramente a la izquierda",
  "slight right": "ligeramente a la derecha",
  "sharp left": "bruscamente a la izquierda",
  "sharp right": "bruscamente a la derecha",
  straight: "derecho",
  uturn: "en U"
};

// Convierte un paso de OSRM en una instrucción en español
function stepToText(step) {
  const { type, modifier, exit } = step.maneuver;
  const direction = MODIFIERS[modifier] || "";
  const street = step.name ? ` por ${step.name}` : "";

  switch (type) {
    case "depart":
      return `Inicia el recorrido${street}`;
    case "arrive":
      return "Llegaste a tu destino";
    case "turn":
    case "end of road":
      return `Gira ${direction}${street}`;
    case "new name":
    case "continue":
      return `Continúa ${direction}${street}`.replace("  ", " ");
    case "roundabout":
    case "rotary":
    case "exit roundabout":
    case "exit rotary":
      return `En la glorieta toma la ${exit ? `salida ${exit}` : "salida indicada"}${street}`;
    case "merge":
    case "on ramp":
    case "off ramp":
    case "fork":
      return `Mantente ${direction}${street}`;
    default:
      return `Sigue ${direction}${street}`.replace("  ", " ");
  }
}

export async function getRoute(origin, destination) {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_URL}/${coords}?overview=full&geometries=geojson&steps=true`;

  const response = await fetch(url);
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.code !== "Ok" || !data.routes?.length) {
    throw new Error("No se pudo calcular la ruta en este momento.");
  }

  const route = data.routes[0];

  return {
    geometry: route.geometry, // GeoJSON LineString
    distance: route.distance, // metros
    duration: route.duration, // segundos
    steps: route.legs[0].steps
      .filter((step) => step.distance > 0 || step.maneuver.type === "arrive")
      .map((step) => ({ text: stepToText(step), distance: step.distance }))
  };
}

// Liga para abrir la ruta en Google Maps (alternativa a pie o en transporte)
export function googleMapsLink(origin, destination) {
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;
}
