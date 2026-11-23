"use strict";

// Datos de ejemplo para León, Guanajuato.
// Coordenadas SIEMPRE en orden [longitud, latitud].
// Los teléfonos son de ejemplo.

const categories = [
    {
        name: "Hospital",
        slug: "hospital",
        color: "#dc2626",
        icon: "🏥",
        description: "Hospitales, clínicas y Cruz Roja"
    },
    {
        name: "Bomberos",
        slug: "bomberos",
        color: "#ea580c",
        icon: "🚒",
        description: "Estaciones del Heroico Cuerpo de Bomberos"
    },
    {
        name: "Policía",
        slug: "policia",
        color: "#2563eb",
        icon: "🚓",
        description: "Módulos de seguridad y estaciones de policía"
    },
    {
        name: "Farmacia",
        slug: "farmacia",
        color: "#16a34a",
        icon: "💊",
        description: "Farmacias y puntos de primeros auxilios"
    }
];

/*
 * Cada punto de ayuda trae (opcional) la información de su entrada en el directorio.
 * El seed crea primero el punto y luego la entrada del directorio apuntando a él.
 */
const helpPoints = [
    // ---------------- HOSPITALES ----------------
    {
        category: "hospital",
        name: "Hospital General de León",
        description: "Hospital público de la Secretaría de Salud con área de urgencias.",
        phone: "477 123 4501",
        schedule: "24 horas",
        coordinates: [-101.6698, 21.1309],
        directory: {
            type: "hospital", status: "saturado", address: "Calle 20 de Enero 927, Obregón, León",
            emergencyPhone: "911", beds: 250, is24h: true,
            specialties: ["Urgencias", "Traumatología", "Pediatría"]
        }
    },
    {
        category: "hospital",
        name: "Hospital Regional de Alta Especialidad del Bajío",
        description: "Hospital de alta especialidad sobre Blvd. Milenio.",
        phone: "477 123 4502",
        schedule: "24 horas",
        coordinates: [-101.6006, 21.0842],
        directory: {
            type: "hospital", status: "operando", address: "Blvd. Milenio 130, San Carlos la Roncha, León",
            emergencyPhone: "477 123 4512", beds: 184, is24h: true,
            specialties: ["Cardiología", "Oncología", "Neurocirugía"]
        }
    },
    {
        category: "hospital",
        name: "Hospital Aranda de la Parra",
        description: "Hospital privado en la zona centro con urgencias.",
        phone: "477 123 4503",
        schedule: "24 horas",
        coordinates: [-101.6830, 21.1270],
        directory: {
            type: "clinica", status: "operando", address: "Hidalgo 329, Centro, León",
            emergencyPhone: "477 123 4513", beds: 80, is24h: true,
            specialties: ["Urgencias", "Ginecología"]
        }
    },
    {
        category: "hospital",
        name: "Cruz Roja Delegación León",
        description: "Atención prehospitalaria y ambulancias.",
        phone: "477 123 4504",
        schedule: "24 horas",
        coordinates: [-101.6600, 21.1180],
        directory: {
            type: "cruz_roja", status: "operando", address: "Blvd. Juan José Torres Landa, León",
            emergencyPhone: "065", beds: 20, is24h: true,
            specialties: ["Ambulancias", "Primeros auxilios"]
        }
    },
    {
        category: "hospital",
        name: "UMAE Hospital de Especialidades No. 1 IMSS",
        description: "Unidad Médica de Alta Especialidad del IMSS.",
        phone: "477 123 4505",
        schedule: "24 horas",
        coordinates: [-101.6600, 21.1350],
        directory: {
            type: "hospital", status: "operando", address: "Blvd. Adolfo López Mateos, León",
            emergencyPhone: "477 123 4515", beds: 300, is24h: true,
            specialties: ["Urgencias", "Medicina interna", "Cirugía"]
        }
    },

    // ---------------- BOMBEROS ----------------
    {
        category: "bomberos",
        name: "Estación Central de Bomberos León",
        description: "Estación central del Heroico Cuerpo de Bomberos.",
        phone: "477 123 4601",
        schedule: "24 horas",
        coordinates: [-101.6745, 21.1225],
        directory: {
            status: "activa", address: "Blvd. Adolfo López Mateos, Centro, León",
            units: 12, chief: "Cmdte. Responsable Central"
        }
    },
    {
        category: "bomberos",
        name: "Estación de Bomberos Norte",
        description: "Estación de bomberos de la zona norte.",
        phone: "477 123 4602",
        schedule: "24 horas",
        coordinates: [-101.6820, 21.1610],
        directory: {
            status: "en_servicio", address: "Blvd. Morelos, zona norte, León",
            units: 6, chief: "Cmdte. Responsable Norte"
        }
    },
    {
        category: "bomberos",
        name: "Estación de Bomberos Sur",
        description: "Estación que cubre la zona sur de la ciudad.",
        phone: "477 123 4603",
        schedule: "24 horas",
        coordinates: [-101.6620, 21.0900],
        directory: {
            status: "activa", address: "Blvd. Aeropuerto, zona sur, León",
            units: 5, chief: "Cmdte. Responsable Sur"
        }
    },

    // ---------------- POLICÍA ----------------
    {
        category: "policia",
        name: "Secretaría de Seguridad Pública de León",
        description: "Comandancia principal de la policía municipal.",
        phone: "477 123 4701",
        schedule: "24 horas",
        coordinates: [-101.6560, 21.1260],
        directory: {
            type: "comandancia", status: "activo", address: "Blvd. Juan José Torres Landa, León",
            sector: "General", officers: 120
        }
    },
    {
        category: "policia",
        name: "Módulo de Policía Plaza Principal",
        description: "Módulo de seguridad frente a la Plaza Principal.",
        phone: "477 123 4702",
        schedule: "24 horas",
        coordinates: [-101.6826, 21.1222],
        directory: {
            type: "modulo", status: "activo", address: "Plaza Principal, Centro, León",
            sector: "Centro", officers: 6
        }
    },
    {
        category: "policia",
        name: "Módulo de Seguridad Arco de la Calzada",
        description: "Módulo de seguridad junto al Arco de la Calzada.",
        phone: "477 123 4703",
        schedule: "08:00 - 22:00",
        coordinates: [-101.6800, 21.1180],
        directory: {
            type: "modulo", status: "activo", address: "Calzada de los Héroes, Centro, León",
            sector: "Centro", officers: 4
        }
    },
    {
        category: "policia",
        name: "Módulo de Seguridad Campestre",
        description: "Módulo de vigilancia de la zona Campestre.",
        phone: "477 123 4704",
        schedule: "24 horas",
        coordinates: [-101.6930, 21.1560],
        directory: {
            type: "modulo", status: "activo", address: "Blvd. Campestre, León",
            sector: "Norponiente", officers: 4
        }
    },

    // ---------------- FARMACIAS ----------------
    {
        category: "farmacia",
        name: "Farmacia del Centro",
        description: "Farmacia con botiquín de primeros auxilios disponible.",
        phone: "477 123 4801",
        schedule: "08:00 - 23:00",
        coordinates: [-101.6840, 21.1235],
        directory: {
            status: "abierta", address: "Madero 120, Centro, León",
            chain: "Independiente", is24h: false, delivery: true
        }
    },
    {
        category: "farmacia",
        name: "Farmacia 24 h López Mateos",
        description: "Farmacia abierta las 24 horas, punto de ayuda participante.",
        phone: "477 123 4802",
        schedule: "24 horas",
        coordinates: [-101.6700, 21.1240],
        directory: {
            status: "abierta", address: "Blvd. Adolfo López Mateos 1500, León",
            chain: "Independiente", is24h: true, delivery: true
        }
    },
    {
        category: "farmacia",
        name: "Farmacia Campestre",
        description: "Farmacia con consultorio médico.",
        phone: "477 123 4803",
        schedule: "09:00 - 21:00",
        coordinates: [-101.6950, 21.1500],
        directory: {
            status: "abierta", address: "Blvd. Campestre 2000, León",
            chain: "Independiente", is24h: false, delivery: false
        }
    },
    {
        category: "farmacia",
        name: "Farmacia San Juan Bosco",
        description: "Farmacia de barrio, punto de ayuda participante.",
        phone: "477 123 4804",
        schedule: "08:00 - 22:00",
        coordinates: [-101.6900, 21.1300],
        status: "inactivo",
        directory: {
            status: "cerrada", address: "Av. San Juan Bosco 450, León",
            chain: "Independiente", is24h: false, delivery: false
        }
    }
];

const zones = [
    {
        name: "Zona Centro",
        description: "Centro histórico de León",
        color: "#7c3aed",
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
        description: "Zona norponiente / Campestre",
        color: "#0891b2",
        coordinates: [[
            [-101.7050, 21.1450],
            [-101.6850, 21.1450],
            [-101.6850, 21.1650],
            [-101.7050, 21.1650],
            [-101.7050, 21.1450]
        ]]
    }
];

module.exports = {
    categories,
    helpPoints,
    zones
};
