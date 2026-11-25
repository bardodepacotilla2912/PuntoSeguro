// Prueba completa de la API de PuntoSeguro contra el servidor y MongoDB Atlas.
//
// Uso (desde la carpeta backend, con el servidor encendido en otra terminal):
//   npm run dev
//   npm test
//
// Para probar el backend publicado:
//   TEST_API_URL=https://tu-backend.vercel.app/api npm test
//
// Prueba registro/login, categorías, puntos de ayuda (con filtros y "más cercano"),
// zonas y los 4 CRUD del directorio (agregar, buscar, filtrar, editar, eliminar y
// validaciones), y revisa directamente en MongoDB que cada cambio se guardó o se borró.
// Todo lo que se crea lleva el prefijo ZZ-PRUEBA y se elimina al final,
// así que los datos existentes no se modifican.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const BACKEND = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(BACKEND + "package.json");
require("dotenv").config({ path: BACKEND + ".env", quiet: true });
const mongoose = require("mongoose");

const API = process.env.TEST_API_URL || `http://localhost:${process.env.PORT || 3000}/api`;
const P = "ZZ-PRUEBA";
const TEST_EMAIL = "zz.prueba.automatica@puntoseguro.com";
const TEST_PASSWORD = "Prueba2026";

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

let ok = 0, fail = 0;
const fallos = [];
let seccion = "";
function titulo(t) { seccion = t; console.log(`\n=== ${t} ===`); }
function check(nombre, cond, extra = "") {
    if (cond) { ok++; console.log(`  ✅ ${nombre}`); }
    else { fail++; fallos.push(`[${seccion}] ${nombre} ${extra}`); console.log(`  ❌ ${nombre} ${extra}`); }
}

async function req(method, path, body, { raw } = {}) {
    const r = await fetch(API + path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: raw ?? (body ? JSON.stringify(body) : undefined)
    });
    let json = null;
    try { json = await r.json(); } catch { }
    return { status: r.status, json };
}
const msg = (r) => `(status ${r.status}: ${JSON.stringify(r.json?.error?.details || r.json?.error?.message || r.json?.message || "").slice(0, 200)})`;

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const col = (n) => db.collection(n);
const oid = (id) => new mongoose.Types.ObjectId(String(id));
const COLS = ["categories", "helppoints", "zones", "hospitals", "firestations", "policestations", "pharmacies", "users"];

async function contar() {
    const out = {};
    for (const c of COLS) out[c] = await col(c).countDocuments();
    return out;
}
const antes = await contar();
console.log(`Servidor: ${API}`);
console.log("Documentos en Atlas antes de la prueba:", antes);

try {
    // ------------------------------------------------------------------
    titulo("1. Inicio de sesión y registro");
    await col("users").deleteOne({ email: TEST_EMAIL });

    let r = await req("POST", "/auth/register", { name: "Prueba Automatica", email: TEST_EMAIL, password: TEST_PASSWORD });
    check("Registrar cuenta nueva → 201", r.status === 201, msg(r));
    check("La respuesta no expone la contraseña", r.json?.data && !("password" in r.json.data));
    const userDb = await col("users").findOne({ email: TEST_EMAIL });
    check("El usuario quedó guardado en Atlas", !!userDb);
    check("La contraseña está cifrada con bcrypt (no en texto plano)", userDb?.password?.startsWith("$2") && userDb.password !== TEST_PASSWORD);

    r = await req("POST", "/auth/register", { name: "Prueba Automatica", email: TEST_EMAIL.toUpperCase(), password: TEST_PASSWORD });
    check("Correo duplicado (aunque cambien mayúsculas) → 400", r.status === 400, msg(r));
    r = await req("POST", "/auth/register", { name: "Prueba", email: "otro.zz@puntoseguro.com", password: "corta" });
    check("Contraseña débil → 400", r.status === 400, msg(r));
    r = await req("POST", "/auth/register", { name: "Prueba", email: "no-es-correo", password: TEST_PASSWORD });
    check("Correo inválido → 400", r.status === 400, msg(r));
    r = await req("POST", "/auth/register", { email: "x.zz@puntoseguro.com", password: TEST_PASSWORD });
    check("Registro sin nombre → 400", r.status === 400, msg(r));
    r = await req("POST", "/auth/register", { name: "Prueba 123", email: "y.zz@puntoseguro.com", password: TEST_PASSWORD });
    check("Nombre con números → 400", r.status === 400, msg(r));

    r = await req("POST", "/auth/login", { email: TEST_EMAIL, password: TEST_PASSWORD });
    check("Iniciar sesión con la cuenta nueva → 200", r.status === 200 && r.json?.data?.email === TEST_EMAIL, msg(r));
    r = await req("POST", "/auth/login", { email: TEST_EMAIL, password: "Incorrecta1" });
    check("Contraseña incorrecta → 401 con mensaje claro", r.status === 401 && /incorrect/i.test(r.json?.error?.message), msg(r));
    r = await req("POST", "/auth/login", { email: "noexiste.zz@puntoseguro.com", password: TEST_PASSWORD });
    check("Correo que no existe → 401", r.status === 401, msg(r));
    r = await req("POST", "/auth/login", { email: "", password: "" });
    check("Login vacío → 400", r.status === 400, msg(r));
    r = await req("POST", "/auth/login", { email: "demo@puntoseguro.com", password: "Demo2026!" });
    check("Usuario de prueba demo@puntoseguro.com / Demo2026! → 200", r.status === 200, msg(r));

    // ------------------------------------------------------------------
    titulo("2. Categorías");
    r = await req("GET", "/categories");
    check("Listar categorías → 4", r.status === 200 && r.json?.count === 4, msg(r));
    const cat = Object.fromEntries((r.json?.data || []).map((c) => [c.name, c.id]));
    check("Existen Hospital, Bomberos, Policía y Farmacia", ["Hospital", "Bomberos", "Policía", "Farmacia"].every((s) => cat[s]));

    // ------------------------------------------------------------------
    titulo("3. Puntos de ayuda (ubicaciones exactas)");
    const base = { lat: 21.1250, lng: -101.6860 };
    const nombresCat = ["Hospital", "Bomberos", "Policía", "Farmacia"];
    const puntos = {};
    for (let i = 0; i < nombresCat.length; i++) {
        const c = nombresCat[i];
        r = await req("POST", "/help-points", {
            name: `${P} Punto ${c}`,
            description: `Punto de prueba automática de ${c}`,
            category: cat[c],
            status: "activo",
            phone: "477 123 4567",
            schedule: "24 horas",
            latitude: base.lat + i * 0.001,
            longitude: base.lng + i * 0.001
        });
        check(`Agregar punto de categoría ${c} → 201`, r.status === 201, msg(r));
        if (r.json?.data?.id) puntos[c] = r.json.data;
    }
    const pid = puntos.Hospital?.id;
    const enDb = await col("helppoints").findOne({ _id: oid(pid) });
    check("El punto quedó guardado en Atlas", !!enDb);
    check("Se guardó como GeoJSON Point [longitud, latitud]", enDb?.location?.type === "Point" && enDb.location.coordinates[0] === base.lng && enDb.location.coordinates[1] === base.lat);
    check("La categoría se guarda como ObjectId (referencia)", enDb?.category instanceof mongoose.Types.ObjectId);
    const idx = await col("helppoints").indexes();
    check("helppoints tiene índice 2dsphere", idx.some((i) => i.key.location === "2dsphere"));

    r = await req("GET", "/help-points");
    check("El punto aparece en el listado", r.json?.data?.some((p) => p.id === pid), msg(r));
    check("populate: la categoría llega con su nombre, no como ObjectId", r.json?.data?.find((p) => p.id === pid)?.category?.name === "Hospital");
    r = await req("GET", `/help-points/${pid}`);
    check("Obtener punto por ID", r.status === 200 && r.json?.data?.name === `${P} Punto Hospital`, msg(r));

    // Búsqueda y filtros (se resuelven en el backend)
    r = await req("GET", `/help-points?search=${encodeURIComponent("zz-prueba punto")}`);
    check("?search= texto parcial sin importar mayúsculas → 4", r.json?.count === 4, msg(r));
    r = await req("GET", `/help-points?search=${encodeURIComponent("zz-prueba punto policia")}`);
    check("?search= ignora acentos (policia encuentra Policía) → 1", r.json?.count === 1, msg(r));
    r = await req("GET", `/help-points?search=${P}&category=${cat.Farmacia}`);
    check("?category= filtra por categoría → 1", r.json?.count === 1 && r.json.data[0].category.name === "Farmacia", msg(r));
    r = await req("GET", `/help-points?search=${P}&status=inactivo`);
    check("?status= (tercer filtro) → 0 inactivos", r.json?.count === 0, msg(r));
    r = await req("GET", `/help-points?search=${P}&category=${cat.Hospital}&status=activo`);
    check("Filtros combinados → 1", r.json?.count === 1, msg(r));
    r = await req("GET", "/help-points?category=xyz");
    check("?category= inválido → 400", r.status === 400, msg(r));
    r = await req("GET", "/help-points?status=borrado");
    check("?status= inválido → 400", r.status === 400, msg(r));
    r = await req("GET", `/help-points/geojson?search=${P}`);
    check("GeoJSON FeatureCollection con 4 features", r.json?.type === "FeatureCollection" && r.json?.features?.length === 4, msg(r));

    // Más cercano
    r = await req("GET", `/help-points/nearest?lat=${base.lat}&lng=${base.lng}`);
    check("Más cercano: el primero es el punto en esa coordenada", r.json?.data?.[0]?.id === pid, msg(r));
    check("Más cercano regresa máximo 5", r.json?.count <= 5, msg(r));
    r = await req("GET", `/help-points/nearest?lat=${base.lat}&lng=${base.lng}&category=${cat["Policía"]}`);
    check("Más cercano filtrado por categoría Policía", r.json?.data?.[0]?.id === puntos["Policía"]?.id, msg(r));
    r = await req("GET", `/help-points/nearest?lng=${base.lng}`);
    check("Más cercano sin latitud → 400", r.status === 400, msg(r));

    // Editar
    r = await req("PATCH", `/help-points/${pid}`, { name: `${P} Punto Hospital EDITADO`, status: "inactivo", latitude: 21.13 });
    check("Editar punto → 200", r.status === 200, msg(r));
    const editado = await col("helppoints").findOne({ _id: oid(pid) });
    check("Cambios guardados en Atlas (nombre y estado)", editado?.name?.endsWith("EDITADO") && editado?.status === "inactivo");
    check("Solo cambió la latitud; la longitud se conserva", editado?.location?.coordinates[1] === 21.13 && editado.location.coordinates[0] === base.lng);
    r = await req("GET", `/help-points/nearest?lat=21.13&lng=${base.lng}`);
    check("Un punto inactivo no sale en 'más cercano'", !r.json?.data?.some((p) => p.id === pid), msg(r));
    r = await req("PATCH", `/help-points/${pid}`, { category: cat.Farmacia });
    check("Cambiar categoría del punto", r.status === 200 && r.json?.data?.category?.name === "Farmacia", msg(r));

    // Validaciones
    r = await req("POST", "/help-points", { name: `${P} x` });
    check("Agregar sin campos obligatorios → 400", r.status === 400, msg(r));
    r = await req("POST", "/help-points", { name: `${P} lat mala`, description: "latitud mala", category: cat.Hospital, status: "activo", latitude: 200, longitude: -101 });
    check("Latitud fuera de rango → 400", r.status === 400, msg(r));
    r = await req("POST", "/help-points", { name: `${P} categoria`, description: "categoría inexistente", category: new mongoose.Types.ObjectId().toString(), status: "activo", latitude: 21, longitude: -101 });
    check("Categoría que no existe → 400", r.status === 400, msg(r));
    r = await req("POST", "/help-points", { name: `${P} telefono`, description: "teléfono malo", category: cat.Hospital, status: "activo", phone: "123", latitude: 21, longitude: -101 });
    check("Teléfono que no tiene 10 dígitos → 400", r.status === 400, msg(r));
    r = await req("POST", "/help-points", { name: `${P} horario`, description: "horario malo", category: cat.Hospital, status: "activo", schedule: "25:00 - 26:00", latitude: 21, longitude: -101 });
    check("Horario inválido → 400", r.status === 400, msg(r));
    r = await req("POST", "/help-points", { name: `${P} extra`, description: "campo extra", category: cat.Hospital, status: "activo", latitude: 21, longitude: -101, hack: true });
    check("Campo no permitido → 400", r.status === 400, msg(r));
    r = await req("PATCH", `/help-points/${pid}`, {});
    check("Editar sin campos → 400", r.status === 400, msg(r));
    r = await req("GET", `/help-points/${new mongoose.Types.ObjectId()}`);
    check("Punto que no existe → 404", r.status === 404, msg(r));
    r = await req("GET", "/help-points/123");
    check("ID con formato inválido → 404", r.status === 404, msg(r));

    // ------------------------------------------------------------------
    titulo("4. Zonas (polígonos)");
    const d = 0.01;
    const anillo = [[base.lng - d, base.lat - d], [base.lng + d, base.lat - d], [base.lng + d, base.lat + d], [base.lng - d, base.lat + d], [base.lng - d, base.lat - d]];
    r = await req("POST", "/zones", { name: `${P} Zona`, coordinates: [anillo] });
    check("Guardar zona → 201", r.status === 201, msg(r));
    const zid = r.json?.data?.id;
    const zDb = zid && await col("zones").findOne({ _id: oid(zid) });
    check("La zona quedó guardada en Atlas como GeoJSON Polygon", zDb?.area?.type === "Polygon" && zDb.area.coordinates[0].length === 5);
    check("Vértices en orden [longitud, latitud]", zDb?.area?.coordinates?.[0]?.[0]?.[0] === base.lng - d);
    check("zones tiene índice 2dsphere", (await col("zones").indexes()).some((i) => i.key.area === "2dsphere"));
    r = await req("GET", "/zones");
    check("La zona se vuelve a cargar en el listado", r.json?.data?.some((z) => z.id === zid), msg(r));
    r = await req("POST", "/zones", { name: `${P} mala`, coordinates: [[[0, 0], [1, 1], [0, 0]]] });
    check("Polígono con menos de 3 vértices → 400", r.status === 400, msg(r));
    r = await req("POST", "/zones", { name: `${P} abierta`, coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1]]] });
    check("Polígono sin cerrar → 400 (no 500)", r.status === 400, msg(r));
    r = await req("POST", "/zones", { name: "ab", coordinates: [anillo] });
    check("Zona con nombre muy corto → 400", r.status === 400, msg(r));
    r = await req("POST", "/zones", { name: `${P} fuera`, coordinates: [[[0, 0], [200, 0], [1, 1], [0, 0]]] });
    check("Vértice fuera de rango → 400", r.status === 400, msg(r));
    r = await req("DELETE", `/zones/${zid}`);
    check("Eliminar zona → 200", r.status === 200, msg(r));
    check("La zona ya no está en Atlas", !(await col("zones").findOne({ _id: oid(zid) })));
    r = await req("DELETE", `/zones/${zid}`);
    check("Eliminar zona otra vez → 404", r.status === 404, msg(r));

    // ------------------------------------------------------------------
    const directorio = [
        { ruta: "/hospitals", col: "hospitals", nombre: "Hospitales",
          body: { type: "clinica", status: "operando", beds: 20 },
          filtro: "type=clinica", editar: { status: "saturado", beds: 35 }, malo: { type: "veterinaria" } },
        { ruta: "/fire-stations", col: "firestations", nombre: "Bomberos",
          body: { status: "activa", units: 3 },
          filtro: "status=activa", editar: { status: "en_servicio", units: 5 }, malo: { units: -5 } },
        { ruta: "/police-stations", col: "policestations", nombre: "Policía",
          body: { type: "modulo", status: "activo", officers: 10 },
          filtro: "type=modulo", editar: { status: "inactivo", officers: 12 }, malo: { type: "cuartel" } },
        { ruta: "/pharmacies", col: "pharmacies", nombre: "Farmacias",
          body: { status: "abierta", schedule: "08:00 - 22:00" },
          filtro: "status=abierta", editar: { status: "cerrada", schedule: "24 horas" }, malo: { schedule: "todo el dia" } }
    ];

    let n = 5;
    for (const e of directorio) {
        titulo(`${n++}. CRUD ${e.nombre}`);
        r = await req("POST", e.ruta, { name: `${P} ${e.nombre}`, phone: "477 000 0000", address: "Calle de Prueba 123, León", ...e.body });
        check("Crear → 201", r.status === 201, msg(r));
        const id = r.json?.data?.id;
        const doc = id && await col(e.col).findOne({ _id: oid(id) });
        check("Quedó guardado en Atlas", !!doc);

        r = await req("GET", e.ruta);
        check("Listar incluye el registro nuevo", r.json?.data?.some((x) => x.id === id), msg(r));
        r = await req("GET", `${e.ruta}?search=${P}`);
        check("Buscar por nombre → 1", r.json?.count === 1, msg(r));
        r = await req("GET", `${e.ruta}?search=${encodeURIComponent("calle de prueba 123")}`);
        check("Buscar por dirección", r.json?.data?.some((x) => x.id === id), msg(r));
        r = await req("GET", `${e.ruta}?search=${P}&${e.filtro}`);
        check(`Filtrar (${e.filtro}) → 1`, r.json?.count === 1, msg(r));
        r = await req("GET", `${e.ruta}/${id}`);
        check("Obtener por ID", r.status === 200 && r.json?.data?.id === id, msg(r));

        r = await req("PATCH", `${e.ruta}/${id}`, { ...e.editar, phone: "477 999 9999" });
        check("Editar → 200", r.status === 200, msg(r));
        const docEd = await col(e.col).findOne({ _id: oid(id) });
        check("Cambios guardados en Atlas", Object.entries(e.editar).every(([k, v]) => docEd?.[k] === v) && docEd?.phone === "477 999 9999");

        r = await req("PATCH", `${e.ruta}/${id}`, e.malo);
        check(`Dato inválido ${JSON.stringify(e.malo)} → 400`, r.status === 400, msg(r));
        r = await req("PATCH", `${e.ruta}/${id}`, { phone: "12345" });
        check("Teléfono que no tiene 10 dígitos → 400", r.status === 400, msg(r));
        r = await req("POST", e.ruta, { name: `${P} incompleto` });
        check("Crear sin campos obligatorios → 400", r.status === 400, msg(r));

        r = await req("DELETE", `${e.ruta}/${id}`);
        check("Eliminar → 200", r.status === 200, msg(r));
        check("Ya no está en Atlas", !(await col(e.col).findOne({ _id: oid(id) })));
        r = await req("GET", `${e.ruta}/${id}`);
        check("Consultarlo otra vez → 404", r.status === 404, msg(r));
    }

    // ------------------------------------------------------------------
    titulo(`${n++}. Manejo de errores (AppError, 404 de rutas, errorHandler)`);
    r = await req("GET", "/no-existe");
    check("Ruta que no existe → 404 con mensaje", r.status === 404 && !!r.json?.error?.message, msg(r));
    r = await req("POST", "/help-points", null, { raw: "{ json mal escrito" });
    check("JSON mal escrito → 400", r.status === 400, msg(r));
    check("Formato de error uniforme { error: { status, message, path, timestamp } }",
        ["status", "message", "path", "timestamp"].every((k) => k in (r.json?.error || {})));

    // ------------------------------------------------------------------
    titulo(`${n++}. Eliminar puntos de ayuda`);
    for (const p of Object.values(puntos)) {
        r = await req("DELETE", `/help-points/${p.id}`);
        check(`Eliminar "${p.name}" → 200`, r.status === 200, msg(r));
        check("  ya no está en Atlas", !(await col("helppoints").findOne({ _id: oid(p.id) })));
    }
    r = await req("DELETE", `/help-points/${pid}`);
    check("Eliminar el mismo punto otra vez → 404", r.status === 404, msg(r));
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
