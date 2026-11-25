"use strict";

// Datos de ejemplo para León, Guanajuato.
// Coordenadas SIEMPRE en orden [longitud, latitud]. Los teléfonos son de ejemplo.

// Usuario de prueba para revisar la aplicación sin registrarse
const demoUser = {
    name: "Usuario Demo",
    email: "demo@puntoseguro.com",
    password: "Demo2026!"
};

const categories = [
    { name: "Hospital", color: "#dc2626" },
    { name: "Bomberos", color: "#ea580c" },
    { name: "Policía", color: "#2563eb" },
    { name: "Farmacia", color: "#16a34a" }
];

// "category" es el nombre de la categoría; el seed lo cambia por su ObjectId
const helpPoints = [
    { category: "Hospital", name: "Hospital General de León", description: "Hospital público con área de urgencias.", status: "activo", phone: "477 123 4501", schedule: "24 horas", coordinates: [-101.6698, 21.1309] },
    { category: "Hospital", name: "Hospital Regional de Alta Especialidad del Bajío", description: "Hospital de alta especialidad sobre Blvd. Milenio.", status: "activo", phone: "477 123 4502", schedule: "24 horas", coordinates: [-101.6006, 21.0842] },
    { category: "Hospital", name: "Hospital Aranda de la Parra", description: "Hospital privado en la zona centro con urgencias.", status: "activo", phone: "477 123 4503", schedule: "24 horas", coordinates: [-101.6830, 21.1270] },
    { category: "Hospital", name: "Cruz Roja Delegación León", description: "Atención prehospitalaria y ambulancias.", status: "activo", phone: "477 123 4504", schedule: "24 horas", coordinates: [-101.6600, 21.1180] },
    { category: "Hospital", name: "UMAE Hospital de Especialidades No. 1 IMSS", description: "Unidad Médica de Alta Especialidad del IMSS.", status: "activo", phone: "477 123 4505", schedule: "24 horas", coordinates: [-101.6600, 21.1350] },

    { category: "Bomberos", name: "Estación Central de Bomberos León", description: "Estación central del Heroico Cuerpo de Bomberos.", status: "activo", phone: "477 123 4601", schedule: "24 horas", coordinates: [-101.6745, 21.1225] },
    { category: "Bomberos", name: "Estación de Bomberos Norte", description: "Estación de bomberos de la zona norte.", status: "activo", phone: "477 123 4602", schedule: "24 horas", coordinates: [-101.6820, 21.1610] },
    { category: "Bomberos", name: "Estación de Bomberos Sur", description: "Estación que cubre la zona sur de la ciudad.", status: "activo", phone: "477 123 4603", schedule: "24 horas", coordinates: [-101.6620, 21.0900] },

    { category: "Policía", name: "Secretaría de Seguridad Pública de León", description: "Comandancia principal de la policía municipal.", status: "activo", phone: "477 123 4701", schedule: "24 horas", coordinates: [-101.6560, 21.1260] },
    { category: "Policía", name: "Módulo de Policía Plaza Principal", description: "Módulo de seguridad frente a la Plaza Principal.", status: "activo", phone: "477 123 4702", schedule: "24 horas", coordinates: [-101.6826, 21.1222] },
    { category: "Policía", name: "Módulo de Seguridad Arco de la Calzada", description: "Módulo de seguridad junto al Arco de la Calzada.", status: "activo", phone: "477 123 4703", schedule: "08:00 - 22:00", coordinates: [-101.6800, 21.1180] },
    { category: "Policía", name: "Módulo de Seguridad Campestre", description: "Módulo de vigilancia de la zona Campestre.", status: "activo", phone: "477 123 4704", schedule: "24 horas", coordinates: [-101.6930, 21.1560] },

    { category: "Farmacia", name: "Farmacia del Centro", description: "Farmacia con botiquín de primeros auxilios.", status: "activo", phone: "477 123 4801", schedule: "08:00 - 23:00", coordinates: [-101.6840, 21.1235] },
    { category: "Farmacia", name: "Farmacia 24 h López Mateos", description: "Farmacia abierta las 24 horas.", status: "activo", phone: "477 123 4802", schedule: "24 horas", coordinates: [-101.6700, 21.1240] },
    { category: "Farmacia", name: "Farmacia Campestre", description: "Farmacia con consultorio médico.", status: "activo", phone: "477 123 4803", schedule: "09:00 - 21:00", coordinates: [-101.6950, 21.1500] },
    { category: "Farmacia", name: "Farmacia San Juan Bosco", description: "Farmacia de barrio, temporalmente cerrada.", status: "inactivo", phone: "477 123 4804", schedule: "08:00 - 22:00", coordinates: [-101.6900, 21.1300] }
];

const zones = [
    {
        name: "Zona Centro",
        coordinates: [[
            [-101.6915, 21.1140],
            [-101.6685, 21.1140],
            [-101.6685, 21.1315],
            [-101.6915, 21.1315],
            [-101.6915, 21.1140]
        ]]
    },
    {
        name: "Zona Campestre",
        coordinates: [[
            [-101.7050, 21.1450],
            [-101.6850, 21.1450],
            [-101.6850, 21.1650],
            [-101.7050, 21.1650],
            [-101.7050, 21.1450]
        ]]
    }
];

const hospitals = [
    { name: "Hospital General de León", type: "hospital", status: "saturado", phone: "477 123 4501", address: "Calle 20 de Enero 927, Obregón, León", beds: 250 },
    { name: "Hospital Regional de Alta Especialidad del Bajío", type: "hospital", status: "operando", phone: "477 123 4502", address: "Blvd. Milenio 130, San Carlos la Roncha, León", beds: 184 },
    { name: "Hospital Aranda de la Parra", type: "clinica", status: "operando", phone: "477 123 4503", address: "Hidalgo 329, Centro, León", beds: 80 },
    { name: "Cruz Roja Delegación León", type: "cruz_roja", status: "operando", phone: "477 123 4504", address: "Blvd. Juan José Torres Landa, León", beds: 20 },
    { name: "UMAE Hospital de Especialidades No. 1 IMSS", type: "hospital", status: "operando", phone: "477 123 4505", address: "Blvd. Adolfo López Mateos, León", beds: 300 }
];

const fireStations = [
    { name: "Estación Central de Bomberos León", status: "activa", phone: "477 123 4601", address: "Blvd. Adolfo López Mateos, Centro, León", units: 12 },
    { name: "Estación de Bomberos Norte", status: "en_servicio", phone: "477 123 4602", address: "Blvd. Morelos, zona norte, León", units: 6 },
    { name: "Estación de Bomberos Sur", status: "activa", phone: "477 123 4603", address: "Blvd. Aeropuerto, zona sur, León", units: 5 }
];

const policeStations = [
    { name: "Secretaría de Seguridad Pública de León", type: "comandancia", status: "activo", phone: "477 123 4701", address: "Blvd. Juan José Torres Landa, León", officers: 120 },
    { name: "Módulo de Policía Plaza Principal", type: "modulo", status: "activo", phone: "477 123 4702", address: "Plaza Principal, Centro, León", officers: 6 },
    { name: "Módulo de Seguridad Arco de la Calzada", type: "modulo", status: "activo", phone: "477 123 4703", address: "Calzada de los Héroes, Centro, León", officers: 4 },
    { name: "Módulo de Seguridad Campestre", type: "modulo", status: "activo", phone: "477 123 4704", address: "Blvd. Campestre, León", officers: 4 }
];

const pharmacies = [
    { name: "Farmacia del Centro", status: "abierta", phone: "477 123 4801", address: "Madero 120, Centro, León", schedule: "08:00 - 23:00" },
    { name: "Farmacia 24 h López Mateos", status: "abierta", phone: "477 123 4802", address: "Blvd. Adolfo López Mateos 1500, León", schedule: "24 horas" },
    { name: "Farmacia Campestre", status: "abierta", phone: "477 123 4803", address: "Blvd. Campestre 2000, León", schedule: "09:00 - 21:00" },
    { name: "Farmacia San Juan Bosco", status: "cerrada", phone: "477 123 4804", address: "Av. San Juan Bosco 450, León", schedule: "08:00 - 22:00" }
];

module.exports = {
    demoUser,
    categories,
    helpPoints,
    zones,
    hospitals,
    fireStations,
    policeStations,
    pharmacies
};
