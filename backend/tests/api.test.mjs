// Prueba completa de la API de PuntoSeguro contra el servidor y MongoDB Atlas.
//
// Uso (desde la carpeta backend, con el servidor encendido en otra terminal):
//   npm run dev
//   npm test
//
// Prueba registro/login, categorías, puntos de ayuda, zonas y los 4 CRUD del
// directorio (agregar, buscar, filtrar, editar, eliminar y validaciones), y
// revisa directamente en la base que cada cambio se guardó o se borró.
// Todo lo que se crea lleva el prefijo ZZ-PRUEBA y se elimina al final,
// así que los datos existentes no se modifican.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const BACKEND = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(BACKEND + "package.json");
require("dotenv").config({ path: BACKEND + ".env", quiet: true });
const mongoose = require("mongoose");

// Se puede apuntar a otro servidor con TEST_API_URL=https://.../api npm test
const API = process.env.TEST_API_URL || `http://localhost:${process.env.PORT || 3000}/api`;

if (!process.env.MONGO_URI) {
    console.log("Falta MONGO_URI en backend/.env");
    process.exit(1);
}
try {
    await fetch(`${API}/health`);
} catch {
    console.log(`No responde el servidor en ${API}. Enciéndelo con "npm run dev" en otra terminal y vuelve a correr "npm test".`);
    process.exit(1);
}
const P = "ZZ-PRUEBA";
const TEST_EMAIL = "zz.prueba.automatica@puntoseguro.com";

let ok = 0, fail = 0;
const fallos = [];
let seccion = "";
function titulo(t) { seccion = t; console.log(`\n=== ${t} ===`); }
function check(nombre, cond, extra = "") {
    if (cond) { ok++; console.log(`  ✅ ${nombre}`); }
    else { fail++; fallos.push(`[${seccion}] ${nombre} ${extra}`); console.log(`  ❌ ${nombre} ${extra}`); }
}

let token = "";
async function req(method, path, body, { auth = true, headers = {} } = {}) {
    const h = { "Content-Type": "application/json", ...headers };
    if (auth && token) h.Authorization = `Bearer ${token}`;
    const r = await fetch(API + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    let json = null;
    try { json = await r.json(); } catch { }
    return { status: r.status, json };
}
const msg = (r) => `(status ${r.status}: ${JSON.stringify(r.json?.error?.details || r.json?.error?.message || r.json?.message || "").slice(0, 160)})`;

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const col = (n) => db.collection(n);
const COLS = ["categories", "helppoints", "zones", "hospitals", "firestations", "policestations", "pharmacies", "users"];

async function contar() {
    const out = {};
    for (const c of COLS) out[c] = await col(c).countDocuments();
    return out;
}
const antes = await contar();
console.log("Documentos en Atlas antes de la prueba:", antes);

const creados = { helpPoints: [], zones: [], directory: [] };

try {
    // ------------------------------------------------------------------
    titulo("1. Autenticación");
    await col("users").deleteOne({ email: TEST_EMAIL });

    let r = await req("POST", "/auth/register", { name: `${P} Usuario`, email: TEST_EMAIL, password: "Prueba2026" }, { auth: false });
    check("Registrar cuenta nueva → 201", r.status === 201, msg(r));
    check("El registro devuelve token", !!r.json?.data?.token);
    check("La respuesta no expone la contraseña", r.json?.data?.user && !("password" in r.json.data.user));
    const userDb = await col("users").findOne({ email: TEST_EMAIL });
    check("El usuario quedó guardado en Atlas", !!userDb);
    check("La contraseña está cifrada en Atlas (bcrypt)", userDb?.password?.startsWith("$2"));

    r = await req("POST", "/auth/register", { name: `${P} Usuario`, email: TEST_EMAIL.toUpperCase(), password: "Prueba2026" }, { auth: false });
    check("Correo duplicado (aunque cambien mayúsculas) → 400", r.status === 400, msg(r));
    r = await req("POST", "/auth/register", { name: `${P}`, email: "otro.zz@puntoseguro.com", password: "corta" }, { auth: false });
    check("Contraseña débil → 400", r.status === 400, msg(r));
    r = await req("POST", "/auth/register", { name: `${P}`, email: "no-es-correo", password: "Prueba2026" }, { auth: false });
    check("Correo inválido → 400", r.status === 400, msg(r));
    r = await req("POST", "/auth/register", { email: "x.zz@puntoseguro.com", password: "Prueba2026" }, { auth: false });
    check("Registro sin nombre → 400", r.status === 400, msg(r));

    r = await req("POST", "/auth/login", { email: TEST_EMAIL, password: "Prueba2026" }, { auth: false });
    check("Iniciar sesión con la cuenta nueva → 200", r.status === 200, msg(r));
    token = r.json?.data?.token;
    r = await req("POST", "/auth/login", { email: TEST_EMAIL, password: "Incorrecta1" }, { auth: false });
    check("Contraseña incorrecta → 401", r.status === 401, msg(r));
    r = await req("POST", "/auth/login", { email: "noexiste.zz@puntoseguro.com", password: "Prueba2026" }, { auth: false });
    check("Correo que no existe → 401", r.status === 401, msg(r));
    r = await req("POST", "/auth/login", { email: "demo@puntoseguro.com", password: "Demo2026!" }, { auth: false });
    check("Iniciar sesión con el usuario demo → 200", r.status === 200, msg(r));

    r = await req("GET", "/auth/me");
    check("/auth/me con token devuelve el usuario", r.status === 200 && r.json?.data?.email === TEST_EMAIL, msg(r));
    r = await req("GET", "/auth/me", null, { auth: false });
    check("/auth/me sin token → 401", r.status === 401, msg(r));
    r = await req("GET", "/help-points", null, { auth: false, headers: { Authorization: "Bearer token-falso" } });
    check("Token falso → 401", r.status === 401, msg(r));
    for (const ruta of ["/categories", "/help-points", "/zones", "/hospitals", "/fire-stations", "/police-stations", "/pharmacies"]) {
        r = await req("GET", ruta, null, { auth: false });
        check(`${ruta} sin sesión está protegido → 401`, r.status === 401, msg(r));
    }

    // ------------------------------------------------------------------
    titulo("2. Categorías");
    r = await req("GET", "/categories");
    check("Listar categorías → 4", r.status === 200 && r.json?.count === 4, msg(r));
    const cat = Object.fromEntries((r.json?.data || []).map((c) => [c.slug, c.id]));
    check("Existen hospital, bomberos, policia y farmacia", ["hospital", "bomberos", "policia", "farmacia"].every((s) => cat[s]));
    r = await req("GET", `/categories/${cat.hospital}`);
    check("Obtener categoría por ID", r.status === 200 && r.json?.data?.slug === "hospital", msg(r));
    r = await req("GET", "/categories/123");
    check("ID de categoría inválido → 404", r.status === 404, msg(r));

    // ------------------------------------------------------------------
    titulo("3. Puntos de ayuda (lugares en el mapa)");
    // Coordenadas cerca del centro de León, Gto.
    const base = { lat: 21.1250, lng: -101.6860 };
    const puntos = {};
    const slugs = ["hospital", "bomberos", "policia", "farmacia"];
    for (let i = 0; i < slugs.length; i++) {
        const s = slugs[i];
        r = await req("POST", "/help-points", {
            name: `${P} Punto ${s}`,
            description: `Punto de prueba automática (${s})`,
            category: cat[s],
            phone: "477 123 4567",
            schedule: "24 horas",
            latitude: base.lat + i * 0.001,
            longitude: base.lng + i * 0.001
        });
        check(`Agregar punto de categoría ${s} → 201`, r.status === 201, msg(r));
        if (r.json?.data?.id) { puntos[s] = r.json.data; creados.helpPoints.push(r.json.data.id); }
    }
    const pid = puntos.hospital?.id;
    const enDb = await col("helppoints").findOne({ _id: new mongoose.Types.ObjectId(pid) });
    check("El punto quedó guardado en Atlas", !!enDb);
    check("Se guardó como GeoJSON [lng, lat]", enDb?.location?.type === "Point" && enDb.location.coordinates[0] === base.lng && enDb.location.coordinates[1] === base.lat);
    check("Estado por defecto = activo", enDb?.status === "activo");
    check("Se registra quién lo creó", String(enDb?.createdBy) === String(userDb?._id));

    r = await req("GET", "/help-points");
    check("El punto aparece en el listado", r.json?.data?.some((p) => p.id === pid), msg(r));
    r = await req("GET", `/help-points/${pid}`);
    check("Obtener punto por ID (con categoría y creador)", r.status === 200 && r.json?.data?.category?.slug === "hospital" && r.json?.data?.createdBy?.email === TEST_EMAIL, msg(r));
    r = await req("GET", `/help-points?search=${encodeURIComponent(P.toLowerCase())}`);
    check("Buscar por nombre (sin importar mayúsculas) → 4", r.json?.count === 4, msg(r));
    r = await req("GET", `/help-points?search=${P}&category=${cat.farmacia}`);
    check("Filtrar por categoría → 1", r.json?.count === 1 && r.json.data[0].category.slug === "farmacia", msg(r));
    r = await req("GET", `/help-points?search=${P}&status=inactivo`);
    check("Filtrar por estado inactivo → 0", r.json?.count === 0, msg(r));
    r = await req("GET", `/help-points/geojson?search=${P}`);
    check("GeoJSON FeatureCollection con 4 features", r.json?.type === "FeatureCollection" && r.json?.features?.length === 4, msg(r));
    r = await req("GET", `/help-points/nearest?lat=${base.lat}&lng=${base.lng}&limit=1`);
    check("Más cercano a la coordenada = el punto de prueba (0 m)", r.json?.data?.[0]?.id === pid && r.json.data[0].distance === 0, msg(r));
    r = await req("GET", `/help-points/nearest?lat=${base.lat}&lng=${base.lng}&category=${cat.policia}&limit=1`);
    check("Más cercano filtrado por categoría policía", r.json?.data?.[0]?.id === puntos.policia?.id, msg(r));
    r = await req("GET", `/help-points/nearest?lng=${base.lng}`);
    check("Más cercano sin latitud → 400", r.status === 400, msg(r));
    r = await req("GET", `/help-points/nearest?lat=${base.lat}&lng=${base.lng}&limit=50`);
    check("Más cercano con limit=50 → 400", r.status === 400, msg(r));

    // Editar
    r = await req("PATCH", `/help-points/${pid}`, { name: `${P} Punto hospital EDITADO`, status: "inactivo", latitude: 21.13 });
    check("Editar punto → 200", r.status === 200, msg(r));
    const editado = await col("helppoints").findOne({ _id: new mongoose.Types.ObjectId(pid) });
    check("Cambios guardados en Atlas (nombre, estado)", editado?.name.endsWith("EDITADO") && editado?.status === "inactivo");
    check("Solo cambió la latitud, la longitud se conserva", editado?.location?.coordinates[1] === 21.13 && editado.location.coordinates[0] === base.lng);
    r = await req("GET", `/help-points/nearest?lat=21.13&lng=${base.lng}&limit=1`);
    check("Un punto inactivo no sale en 'más cercano'", r.json?.data?.[0]?.id !== pid, msg(r));
    r = await req("PATCH", `/help-points/${pid}`, { latitude: 21.125, status: "activo" });
    check("Regresar el punto a su lugar y a activo", r.status === 200, msg(r));

    // Validaciones
    r = await req("POST", "/help-points", { name: `${P} x` });
    check("Agregar sin campos obligatorios → 400", r.status === 400, msg(r));
    r = await req("POST", "/help-points", { name: `${P} lat mala`, description: "latitud mala", category: cat.hospital, latitude: 200, longitude: -101 });
    check("Latitud fuera de rango → 400", r.status === 400, msg(r));
    r = await req("POST", "/help-points", { name: `${P} cat`, description: "categoría inexistente", category: new mongoose.Types.ObjectId().toString(), latitude: 21, longitude: -101 });
    check("Categoría que no existe → 400", r.status === 400, msg(r));
    r = await req("POST", "/help-points", { name: `${P} tel`, description: "teléfono malo", category: cat.hospital, phone: "abc", latitude: 21, longitude: -101 });
    check("Teléfono con letras → 400", r.status === 400, msg(r));
    r = await req("PATCH", `/help-points/${pid}`, { status: "borrado" });
    check("Editar con estado inválido → 400", r.status === 400, msg(r));
    r = await req("GET", `/help-points/${new mongoose.Types.ObjectId()}`);
    check("Punto que no existe → 404", r.status === 404, msg(r));
    r = await req("GET", "/help-points?category=xyz");
    check("Filtro con categoría inválida → 400", r.status === 400, msg(r));

    // ------------------------------------------------------------------
    titulo("4. Zonas (polígonos)");
    const d = 0.01;
    r = await req("POST", "/zones", {
        name: `${P} Zona`,
        description: "Zona de prueba",
        color: "#ff0000",
        // Anillo sin cerrar: la API debe cerrarlo sola
        coordinates: [[[base.lng - d, base.lat - d], [base.lng + d, base.lat - d], [base.lng + d, base.lat + d], [base.lng - d, base.lat + d]]]
    });
    check("Agregar zona → 201", r.status === 201, msg(r));
    const zid = r.json?.data?.id;
    if (zid) creados.zones.push(zid);
    const zDb = await col("zones").findOne({ _id: new mongoose.Types.ObjectId(zid) });
    check("La zona quedó guardada en Atlas", !!zDb);
    check("El polígono se cerró automáticamente (5 vértices)", zDb?.area?.coordinates?.[0]?.length === 5);
    r = await req("GET", "/zones");
    check("La zona aparece en el listado", r.json?.data?.some((z) => z.id === zid), msg(r));
    r = await req("GET", `/zones/${zid}`);
    check("Obtener zona por ID", r.status === 200, msg(r));
    r = await req("GET", "/zones/geojson");
    check("Zonas en GeoJSON", r.json?.type === "FeatureCollection", msg(r));
    r = await req("GET", `/help-points?search=${P}&zone=${zid}`);
    check("Filtrar puntos dentro de la zona → los 4 de prueba", r.json?.count === 4, msg(r));
    r = await req("PATCH", `/zones/${zid}`, { color: "#00ff00", name: `${P} Zona editada` });
    check("Editar zona → 200", r.status === 200, msg(r));
    check("Cambio guardado en Atlas", (await col("zones").findOne({ _id: zDb?._id }))?.color === "#00ff00");
    r = await req("POST", "/zones", { name: `${P} mala`, coordinates: [[[0, 0], [1, 1]]] });
    check("Polígono con menos de 3 vértices → 400", r.status === 400, msg(r));
    r = await req("POST", "/zones", { name: `${P} color`, color: "rojo", coordinates: [[[0, 0], [1, 0], [1, 1]]] });
    check("Color inválido → 400", r.status === 400, msg(r));
    r = await req("GET", `/help-points?zone=${new mongoose.Types.ObjectId()}`);
    check("Filtrar por zona que no existe → 404", r.status === 404, msg(r));

    // ------------------------------------------------------------------
    const directorio = [
        { ruta: "/hospitals", col: "hospitals", slug: "hospital", nombre: "Hospitales",
          extra: { type: "clinica", emergencyPhone: "911", beds: 20, specialties: ["Urgencias", "Pediatría"], is24h: true },
          status: "operando", nuevoStatus: "saturado", malo: { type: "veterinaria" } },
        { ruta: "/fire-stations", col: "firestations", slug: "bomberos", nombre: "Bomberos",
          extra: { units: 3, chief: "Comandante Prueba" },
          status: "activa", nuevoStatus: "en_servicio", malo: { units: -5 } },
        { ruta: "/police-stations", col: "policestations", slug: "policia", nombre: "Policía",
          extra: { type: "modulo", sector: "Centro", officers: 10 },
          status: "activo", nuevoStatus: "inactivo", malo: { type: "cuartel" } },
        { ruta: "/pharmacies", col: "pharmacies", slug: "farmacia", nombre: "Farmacias",
          extra: { chain: "Cadena Prueba", is24h: false, delivery: true },
          status: "abierta", nuevoStatus: "cerrada", malo: { delivery: "si" } }
    ];

    let n = 5;
    for (const e of directorio) {
        titulo(`${n++}. Directorio: ${e.nombre}`);
        const body = { name: `${P} ${e.nombre}`, phone: "477 000 0000", address: "Calle de Prueba 123, León", status: e.status, helpPoint: puntos[e.slug]?.id, ...e.extra };
        r = await req("POST", e.ruta, body);
        check("Agregar registro vinculado a su punto del mapa → 201", r.status === 201, msg(r));
        const id = r.json?.data?.id;
        if (id) creados.directory.push({ ruta: e.ruta, col: e.col, id });
        const oid = id && new mongoose.Types.ObjectId(id);
        const doc = await col(e.col).findOne({ _id: oid });
        check("Quedó guardado en Atlas con el vínculo al punto", doc && String(doc.helpPoint) === puntos[e.slug]?.id);

        r = await req("GET", `${e.ruta}?search=${P}`);
        check("Buscar por nombre → 1", r.json?.count === 1, msg(r));
        r = await req("GET", `${e.ruta}?search=${encodeURIComponent("calle de prueba")}`);
        check("Buscar por dirección", r.json?.data?.some((x) => x.id === id), msg(r));
        r = await req("GET", `${e.ruta}?search=${P}&status=${e.nuevoStatus}`);
        check(`Filtrar por estado ${e.nuevoStatus} → 0`, r.json?.count === 0, msg(r));
        r = await req("GET", `${e.ruta}/${id}`);
        check("Obtener por ID (con datos del punto vinculado)", r.status === 200 && r.json?.data?.helpPoint?.id === puntos[e.slug]?.id, msg(r));

        r = await req("PATCH", `${e.ruta}/${id}`, { status: e.nuevoStatus, phone: "477 999 9999" });
        check("Editar → 200", r.status === 200, msg(r));
        const docEd = await col(e.col).findOne({ _id: oid });
        check("Cambios guardados en Atlas", docEd?.status === e.nuevoStatus && docEd?.phone === "477 999 9999");

        const otro = slugs.find((s) => s !== e.slug);
        r = await req("PATCH", `${e.ruta}/${id}`, { helpPoint: puntos[otro]?.id });
        check(`Vincular a un punto de otra categoría (${otro}) → 400`, r.status === 400, msg(r));
        r = await req("PATCH", `${e.ruta}/${id}`, e.malo);
        check(`Dato inválido ${JSON.stringify(e.malo)} → 400`, r.status === 400, msg(r));
        r = await req("POST", e.ruta, { name: `${P} incompleto` });
        check("Agregar sin campos obligatorios → 400", r.status === 400, msg(r));
        r = await req("PATCH", `${e.ruta}/${id}`, { helpPoint: null });
        check("Quitar el vínculo con el mapa (helpPoint: null)", r.status === 200 && (await col(e.col).findOne({ _id: oid }))?.helpPoint === null, msg(r));
        r = await req("PATCH", `${e.ruta}/${id}`, { helpPoint: puntos[e.slug]?.id });
        check("Volver a vincularlo", r.status === 200, msg(r));
    }

    // ------------------------------------------------------------------
    titulo(`${n++}. "Más cercano" incluye el contacto del directorio`);
    r = await req("GET", `/help-points/nearest?lat=${base.lat}&lng=${base.lng}&limit=1`);
    check("El punto trae el contacto del hospital vinculado", r.json?.data?.[0]?.directory?.name === `${P} Hospitales`, msg(r));

    // ------------------------------------------------------------------
    titulo(`${n++}. Eliminar`);
    // Borrar un punto que tiene registro de directorio vinculado
    r = await req("DELETE", `/help-points/${pid}`);
    check("Eliminar punto → 200", r.status === 200, msg(r));
    check("El punto ya no está en Atlas", !(await col("helppoints").findOne({ _id: new mongoose.Types.ObjectId(pid) })));
    const hosp = creados.directory.find((x) => x.col === "hospitals");
    const hospDoc = await col("hospitals").findOne({ _id: new mongoose.Types.ObjectId(hosp.id) });
    check("El hospital vinculado sigue existiendo pero sin vínculo (helpPoint = null)", hospDoc && hospDoc.helpPoint === null);
    r = await req("GET", `/help-points/${pid}`);
    check("Consultar punto borrado → 404", r.status === 404, msg(r));
    r = await req("DELETE", `/help-points/${pid}`);
    check("Borrarlo otra vez → 404", r.status === 404, msg(r));
    creados.helpPoints = creados.helpPoints.filter((x) => x !== pid);

    for (const e of [...creados.directory]) {
        r = await req("DELETE", `${e.ruta}/${e.id}`);
        check(`Eliminar registro de ${e.ruta} → 200`, r.status === 200, msg(r));
        check(`  ya no está en Atlas`, !(await col(e.col).findOne({ _id: new mongoose.Types.ObjectId(e.id) })));
        r = await req("GET", `${e.ruta}/${e.id}`);
        check(`  consultarlo → 404`, r.status === 404, msg(r));
    }
    creados.directory = [];

    for (const id of [...creados.helpPoints]) {
        r = await req("DELETE", `/help-points/${id}`);
        check("Eliminar punto de prueba → 200", r.status === 200, msg(r));
    }
    creados.helpPoints = [];

    r = await req("DELETE", `/zones/${zid}`);
    check("Eliminar zona → 200", r.status === 200, msg(r));
    check("La zona ya no está en Atlas", !(await col("zones").findOne({ _id: zDb?._id })));
    r = await req("DELETE", `/zones/${zid}`);
    check("Borrar zona otra vez → 404", r.status === 404, msg(r));
    creados.zones = [];
} catch (err) {
    fail++;
    fallos.push(`Error inesperado: ${err.stack}`);
    console.log("ERROR INESPERADO:", err);
} finally {
    // Limpieza de seguridad: borra cualquier resto de la prueba directamente en Atlas
    const regex = new RegExp(`^${P}`);
    for (const c of ["helppoints", "zones", "hospitals", "firestations", "policestations", "pharmacies"]) {
        await col(c).deleteMany({ name: regex });
    }
    await col("users").deleteOne({ email: TEST_EMAIL });

    titulo("Verificación final");
    const despues = await contar();
    console.log("Documentos en Atlas después de la prueba:", despues);
    check("Los datos originales quedaron igual que antes", JSON.stringify(antes) === JSON.stringify(despues));
    await mongoose.disconnect();

    console.log(`\nRESULTADO: ${ok} pruebas OK, ${fail} fallidas`);
    if (fallos.length) console.log("Fallos:\n - " + fallos.join("\n - "));
    process.exit(fail ? 1 : 0);
}
