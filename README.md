# PuntoSeguro – Red de puntos de ayuda

Aplicación web georreferenciada de **León, Guanajuato**. Muestra en un mapa los lugares donde una persona puede pedir ayuda ante una emergencia: **hospitales, estaciones de bomberos, módulos de policía y farmacias participantes**.

- 📍 Ubicación de los puntos de ayuda en el mapa (Leaflet + OpenStreetMap)
- 🧭 Búsqueda del punto **más cercano** (`$geoNear` con índice `2dsphere`)
- 📇 Información de contacto (teléfono, horario, dirección, urgencias)
- 🚗 **Ruta para llegar** (OSRM) y liga a Google Maps
- ⬡ Zonas dibujadas en el mapa (GeoJSON Polygon) para filtrar los puntos

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3 + Vite, Vue Router, Leaflet, Leaflet-Geoman (dibujo de zonas) |
| Backend | Node.js + Express 5 (config, models, routes, services, middlewares, utils) |
| Base de datos | MongoDB Atlas + Mongoose (GeoJSON Point / Polygon, índice 2dsphere) |
| Seguridad | Contraseñas cifradas con bcrypt, sesión con JWT, credenciales solo en `.env` |

## Estructura del proyecto

```
PuntoSeguro/
├── backend/
│   ├── .env.example
│   └── src/
│       ├── index.js              # Arranque: conecta MongoDB y levanta Express
│       ├── app.js                # CORS, JSON, logs, rutas y manejo de errores
│       ├── config/database.js    # Conexión con Mongoose
│       ├── models/               # Esquemas de Mongoose
│       ├── routes/               # Solo reciben la petición y llaman al servicio
│       ├── services/             # Lógica y operaciones con MongoDB (uno por entidad)
│       ├── middlewares/          # Validaciones, auth (JWT) y errorHandler
│       ├── utils/                # AppError, validador, búsqueda, tokens, constantes
│       └── data/                 # Seed con datos de ejemplo de León
└── frontend/
    ├── .env.example
    └── src/
        ├── views/                # Login, Mapa, Más cercano, Directorio
        ├── components/           # Tabla, filtros, zonas, CRUD, modales, toasts
        ├── services/api.js       # Llamadas a la API (fetch + token)
        ├── stores/auth.js        # Sesión del usuario
        ├── router/               # Rutas protegidas
        └── utils/                # Mapa, popups, rutas (OSRM), formatos
```

## Modelos y relaciones (MongoDB)

| Colección | Campos principales | Relaciones (ObjectId + populate) |
|---|---|---|
| `users` | name, email (único), password (bcrypt) | — |
| `categories` | name, slug, color, icon | — |
| `helppoints` (ubicaciones) | name, description, status, phone, schedule, **location: Point [lng, lat]** | → `category`, → `createdBy` (User) |
| `zones` | name, description, color, **area: Polygon [[[lng, lat]...]]** | → `createdBy` (User) |
| `hospitals` | name, phone, address, status, type, emergencyPhone, beds, specialties, is24h | → `helpPoint`, → `createdBy` |
| `firestations` | name, phone, address, status, units, chief | → `helpPoint`, → `createdBy` |
| `policestations` | name, phone, address, status, type, sector, officers | → `helpPoint`, → `createdBy` |
| `pharmacies` | name, phone, address, status, chain, is24h, delivery | → `helpPoint`, → `createdBy` |

Los 4 CRUD del directorio (hospitales, bomberos, policía y farmacias) son distintos de usuarios, ubicaciones y zonas.
Cada registro del directorio puede vincularse a su punto en el mapa; el backend verifica que el punto sea de la misma categoría.

## Endpoints principales

Todas las rutas excepto `/api/auth/register`, `/api/auth/login` y `/api/health` requieren el header `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Crear cuenta (201) |
| POST | `/api/auth/login` | Iniciar sesión (200 / 401) |
| GET | `/api/auth/me` | Usuario de la sesión |
| GET | `/api/categories` | Catálogo de categorías |
| GET | `/api/help-points?search=&category=&status=&zone=` | Listar / filtrar ubicaciones |
| GET | `/api/help-points/geojson` | Mismos filtros como FeatureCollection |
| GET | `/api/help-points/nearest?lat=&lng=&category=&limit=&maxDistance=` | Más cercanos (distancia en metros) |
| POST / PATCH / DELETE | `/api/help-points[/:id]` | Crear, editar y eliminar ubicaciones |
| GET / POST / PATCH / DELETE | `/api/zones[/:id]` | CRUD de zonas (Polygon) |
| GET / POST / PATCH / DELETE | `/api/hospitals[/:id]` | CRUD hospitales |
| GET / POST / PATCH / DELETE | `/api/fire-stations[/:id]` | CRUD bomberos |
| GET / POST / PATCH / DELETE | `/api/police-stations[/:id]` | CRUD policía |
| GET / POST / PATCH / DELETE | `/api/pharmacies[/:id]` | CRUD farmacias |

Códigos usados: 200, 201, 400 (validación), 401 (sin sesión / credenciales), 404 (no existe), 500 (error interno).

## Cómo ejecutarlo localmente

Requisitos: Node.js 20 o superior y una base de datos en MongoDB Atlas.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita `backend/.env` y coloca tu cadena de conexión de Atlas en `MONGO_URI` y una clave larga en `JWT_SECRET`.

```bash
npm run seed   # crea categorías, puntos, directorio, zonas y el usuario de prueba
npm run dev    # http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev    # http://localhost:5173
```

`VITE_API_URL` debe apuntar a la API (por defecto `http://localhost:3000/api`).

### Usuario de prueba

El seed crea un usuario con los datos de `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` del `.env`
(por defecto `demo@puntoseguro.com` / `Demo2026!`). Cámbialos en el `.env` antes de publicar.

## Vistas

1. **Acceso** – Iniciar sesión / crear cuenta.
2. **Mapa** – Clic en el mapa para registrar un punto; editar y eliminar desde el popup; búsqueda y filtros; dibujo de zonas; tabla en tiempo real.
3. **Más cercano** – Usa tu ubicación (o un clic en el mapa) y muestra los puntos activos más cercanos con su contacto y la ruta para llegar.
4. **Directorio** – CRUD de hospitales, bomberos, policía y farmacias vinculados a su punto en el mapa.

> Las rutas se calculan con el servidor público de demostración de OSRM; si no responde, la app muestra la línea recta y la liga a Google Maps.
