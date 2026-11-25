# PuntoSeguro – Red de puntos de ayuda

Aplicación web de **León, Guanajuato** que muestra en un mapa los lugares donde una persona puede pedir ayuda ante una emergencia: **hospitales, bomberos, módulos de policía y farmacias**.

- Ubicación de los puntos de ayuda en el mapa.
- Búsqueda del punto más cercano.
- Información de contacto (teléfono y horario).
- Ruta para llegar.

## Tecnologías

| Parte | Tecnología |
|---|---|
| Frontend | Vue 3 (Vite), Vue Router, Leaflet, Leaflet-Geoman (dibujo de zonas) |
| Backend | Node.js + Express |
| Base de datos | MongoDB Atlas + Mongoose |
| Seguridad | Contraseñas cifradas con bcrypt; cadena de conexión solo en `.env` |

## Estructura del backend

```
backend/src/
├── index.js        # Conecta MongoDB y levanta el servidor
├── app.js          # CORS, JSON, log de peticiones, rutas y errores
├── config/         # Conexión a MongoDB
├── models/         # Esquemas de Mongoose
├── routes/         # Reciben la petición y llaman al servicio
├── services/       # Lógica y operaciones con MongoDB (uno por entidad)
├── middlewares/    # Validaciones y manejo de errores (errorHandler)
├── utils/          # AppError
└── data/           # Seed con datos de ejemplo
```

## Modelos (MongoDB)

| Colección | Campos |
|---|---|
| `users` | name, email (único), password (cifrada con bcrypt) |
| `categories` | name, color |
| `helppoints` | name, description, **category (ObjectId → categories)**, status, phone, schedule, **location (GeoJSON Point [longitud, latitud])** |
| `zones` | name, **area (GeoJSON Polygon)** |
| `hospitals` | name, type, status, phone, address, beds |
| `firestations` | name, status, phone, address, units |
| `policestations` | name, type, status, phone, address, officers |
| `pharmacies` | name, status, phone, address, schedule |

`helppoints` y `zones` tienen índice `2dsphere`.
La relación por referencia es **punto de ayuda → categoría** (ObjectId + `populate`): en la tabla y en el mapa la categoría se muestra por su nombre.

Los 3+ CRUD propios del proyecto son: hospitales, bomberos, policía y farmacias.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Crear cuenta |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/categories` | Categorías |
| GET | `/api/help-points?search=&category=&status=` | Listar y filtrar puntos |
| GET | `/api/help-points/geojson` | Puntos en formato GeoJSON |
| GET | `/api/help-points/nearest?lat=&lng=&category=` | 5 puntos activos más cercanos (`$near`) |
| POST / PATCH / DELETE | `/api/help-points[/:id]` | Crear, editar y eliminar puntos |
| GET / POST / DELETE | `/api/zones[/:id]` | Zonas |
| GET / POST / PATCH / DELETE | `/api/hospitals[/:id]` | CRUD hospitales |
| GET / POST / PATCH / DELETE | `/api/fire-stations[/:id]` | CRUD bomberos |
| GET / POST / PATCH / DELETE | `/api/police-stations[/:id]` | CRUD policía |
| GET / POST / PATCH / DELETE | `/api/pharmacies[/:id]` | CRUD farmacias |

Códigos de respuesta: 200, 201, 400, 401, 404 y 500.

## Cómo ejecutarlo localmente

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

En `backend/.env` coloca tu cadena de conexión de MongoDB Atlas en `MONGO_URI`.

```bash
npm run seed
npm run dev
```

La API queda en `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

La aplicación queda en `http://localhost:5173`.

### Usuario de prueba

El seed crea el usuario **demo@puntoseguro.com** con la contraseña **Demo2026!**.

## Vistas

1. **Login / registro**.
2. **Mapa**: registrar puntos con clic en el mapa, editarlos y eliminarlos desde su popup, filtros, dibujo de zonas y tabla de ubicaciones.
3. **Más cercano**: clic en el mapa donde estás, los 5 puntos activos más cercanos y la ruta para llegar (OSRM).
4. **Directorio**: CRUD de hospitales, bomberos, policía y farmacias.
