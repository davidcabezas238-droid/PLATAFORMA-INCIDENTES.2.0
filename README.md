# Plataforma de incidentes

Aplicación de registro de incidentes de seguridad. El frontend es HTML, CSS y JavaScript modular; el backend es una API Express que utiliza Prisma 7 y MySQL/MariaDB.

## Arquitectura

El backend organiza la autenticación y los incidentes con el patrón MVC:

- **Vista:** `FRON_END/` contiene las páginas y scripts del navegador.
- **Rutas:** `BACK-END/routers/` declara las rutas HTTP y los middlewares.
- **Controladores:** `BACK-END/controllers/` valida solicitudes y construye las respuestas.
- **Modelos:** `BACK-END/modelos/` consulta y modifica los datos.
- **Middleware:** `BACK-END/middleware/` verifica JWT y permisos.

### Flujo MVC de autenticación

1. `POST /login` llega a `routers/autenticacion.routes.js`.
2. `controllers/autenticacion.controller.js` valida correo y clave, solicita el usuario al modelo y firma un JWT sin incluir la clave ni su hash.
3. `modelos/usuarios.model.js` busca el usuario por correo. Los usuarios de demostración se mantienen en memoria.
4. `GET /sesion` verifica el JWT mediante `middleware/verificar_token.js` y devuelve el correo y rol del usuario autenticado.

El registro de incidentes sigue el mismo flujo: las rutas delegan en `controllers/incidentes.controller.js`, que valida la solicitud y utiliza `modelos/incidentes.model.js` para persistir en Prisma.

## Funciones

- Inicio de sesión con JWT y control de acceso por rol.
- Crear, listar, filtrar, consultar, actualizar y eliminar incidentes.
- Listar incidentes en páginas de 25 elementos (máximo 100), con totales agregados.
- Adjuntar una imagen o un video al crear un incidente. Se admiten JPG, PNG, GIF, WebP, MP4, WebM y MOV, con un máximo de 25 MB por archivo.
- Los archivos se guardan en `BACK-END/uploads/`, carpeta excluida de Git. La descarga se realiza por una ruta protegida con JWT.
- Las respuestas HTTP superiores al umbral configurado usan compresión gzip/deflate.

## Requisitos y configuración

Se requiere Node.js, npm y una base MySQL/MariaDB accesible. Configura `BACK-END/.env` con:

- `DATABASE_URL`: conexión a la base de datos.
- `JWT_SECRET`: secreto usado para firmar JWT y proteger el certificado HTTPS local.

Para desarrollo local HTTPS se requiere `BACK-END/certs/localhost.pfx`; su frase de paso debe coincidir con `JWT_SECRET`. No publiques el archivo `.env`, el certificado ni los archivos de `uploads`.

## Instalación y ejecución

Desde PowerShell, en la raíz del proyecto:

```powershell
cd BACK-END
npm install
npx prisma generate
npx prisma db push
npm run lint
npm test -- --test-force-exit --test-reporter=spec
npm start
```

El backend se inicia en `https://localhost:3000`, salvo que `PORT` esté definido en el entorno. El mismo servidor Express entrega el frontend estático desde `FRON_END/`.

## Despliegue en Railway

El `Dockerfile` de la raíz construye desde la raíz del repositorio para incluir también `FRON_END/`. Crea un proyecto en Railway y:

1. Añade un servicio desde el repositorio privado `davidcabezas238-droid/PLATAFORMA-INCIDENTES.2.0` y deja vacía la opción **Root Directory**.
2. Añade un servicio MySQL. En las variables del servicio de la aplicación, define `DATABASE_URL=${{ MySQL.MYSQL_URL }}` (ajusta `MySQL` si cambiaste el nombre del servicio de base de datos).
3. Define `JWT_SECRET` con un secreto aleatorio largo. En producción Railway termina HTTPS; la app escucha HTTP en el puerto `PORT` y no requiere el certificado local.
4. Añade un volumen persistente montado en `/data` y configura `UPLOADS_DIR=/data/uploads`. Sin volumen, los adjuntos se perderían al recrear el contenedor.
5. Despliega. Al arrancar, el contenedor sincroniza el esquema Prisma y expone `GET /healthz` como health check.

`GET /incidentes` devuelve `{ items, total, page, pageSize, totalPages, resumen }`. Admite `page` y `pageSize` (entre 1 y 100); los filtros `q`, `prioridad` y `estado` se aplican antes de paginar.

Benchmark local reproducible con MariaDB y 5.000 registros sintéticos: la consulta completa bajó de 76,50 ms de mediana (p95: 93,15 ms) a 16,29 ms (p95: 30,82 ms) para una página de 25 elementos, incluyendo el conteo y el resumen (reducción de mediana cercana al 79%). Es una medición local, no una garantía de producción. Para repetirla, ejecuta `npm run benchmark` desde `BACK-END` con `DATABASE_URL` configurada y una base de pruebas representativa.

## Endpoints principales

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/login` | Validar credenciales y recibir JWT |
| `GET` | `/sesion` | Consultar el usuario autenticado |
| `GET` | `/incidentes` | Listar por página o filtrar con `q`, `prioridad` y `estado` |
| `POST` | `/incidentes` | Crear un incidente; acepta `multipart/form-data` y un archivo opcional en el campo `archivo` |
| `GET` | `/incidentes/:id/archivo` | Descargar un adjunto con JWT |
| `GET` | `/incidentes/:id` | Consultar un incidente |
| `PUT` | `/incidentes/:id` | Actualizar datos del incidente |
| `DELETE` | `/incidentes/:id` | Eliminar un incidente; requiere rol administrador |

Los endpoints de incidentes requieren `Authorization: Bearer <token>`.

## Validación

- `npm run lint` analiza JavaScript del backend y frontend con ESLint.
- `npm test -- --test-force-exit --test-reporter=spec` ejecuta las pruebas de reglas de negocio y la prueba de integración de adjuntos.
- `GET /healthz` confirma la disponibilidad del servidor para el health check del despliegue.
