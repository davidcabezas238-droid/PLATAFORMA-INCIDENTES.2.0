# Plataforma de incidentes

Aplicación de registro de incidentes de seguridad. El frontend es HTML, CSS y JavaScript modular; el backend es una API Express que utiliza Prisma 7 y PostgreSQL en Supabase.

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
- En desarrollo, los archivos se guardan en `BACK-END/uploads/`; en el despliegue gratuito se almacenan en un bucket privado de Supabase Storage. La descarga se realiza por una ruta protegida con JWT.
- Las respuestas HTTP superiores al umbral configurado usan compresión gzip/deflate.

## Requisitos y configuración

Se requiere Node.js, npm y una base PostgreSQL accesible. Configura `BACK-END/.env` con:

- `DATABASE_URL`: URL PostgreSQL usada por la aplicación.
- `DIRECT_URL`: URL de sesión PostgreSQL usada para sincronizar el esquema Prisma (puede ser igual a `DATABASE_URL`).
- `JWT_SECRET`: secreto usado para firmar JWT y proteger el certificado HTTPS local.
- `STORAGE_DRIVER=local` para desarrollo local, o `STORAGE_DRIVER=supabase` al desplegar.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_STORAGE_BUCKET` para Supabase Storage.

Para desarrollo local HTTPS se requiere `BACK-END/certs/localhost.pfx`; su frase de paso debe coincidir con `JWT_SECRET`. No publiques el archivo `.env`, el certificado, la clave service-role ni los archivos de `uploads`.

## Instalación y ejecución

Desde PowerShell, en la raíz del proyecto, configura las URLs de PostgreSQL en `.env` antes de ejecutar Prisma:

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

## Despliegue gratuito de demostración: Render + Supabase

La raíz incluye un `render.yaml` para desplegar el servicio web gratuito desde el repositorio. Los límites de los planes gratuitos pueden cambiar:

1. Crea un proyecto gratuito en Supabase.
2. En **Storage**, crea el bucket privado `evidencias-incidentes`. No lo hagas público: la API descarga cada archivo solo después de verificar el JWT.
3. En **Connect**, selecciona el **Session pooler** y copia la URI PostgreSQL. Úsala para `DATABASE_URL` y `DIRECT_URL`; en el formulario sustituye la contraseña de ejemplo por la contraseña de base de datos. No compartas estas cadenas ni la clave `service_role`.
4. En Supabase, copia la **Project URL** y la clave secreta `service_role` desde la configuración de API.
5. En Render, selecciona **New > Blueprint** y conecta `davidcabezas238-droid/PLATAFORMA-INCIDENTES.2.0`. Revisa y confirma el servicio gratuito `plataforma-incidentes`. El `Dockerfile` de la raíz incluye el backend y `FRON_END/`; el servicio aplica la migración Prisma al arrancar y usa `/healthz` como health check.
6. En las variables del servicio Render, completa `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` con los valores de Supabase. Conserva `STORAGE_DRIVER=supabase` y el nombre del bucket configurado por el Blueprint. `JWT_SECRET` se genera automáticamente.
7. Espera a que termine el despliegue y abre la URL pública de Render. La primera respuesta puede tardar porque el servicio gratuito entra en suspensión tras 15 minutos sin tráfico.

El plan gratuito de Supabase incluye 500 MB de base de datos y 1 GB de almacenamiento de archivos, y pausa los proyectos inactivos durante una semana. Render Free puede tardar aproximadamente un minuto en despertar; su disco es efímero, por lo que los adjuntos se guardan en Supabase Storage. Estos límites hacen que la combinación sirva para una demostración académica, no para producción.

La migración cambia la base de datos de MySQL a PostgreSQL y el almacenamiento de adjuntos a Supabase Storage. **No copia automáticamente los registros ni los archivos de la base de datos MySQL anterior**; la nueva base empieza vacía. Los archivos locales de `BACK-END/uploads/` tampoco se publican en Git y no se transfieren automáticamente.

`GET /incidentes` devuelve `{ items, total, page, pageSize, totalPages, resumen }`. Admite `page` y `pageSize` (entre 1 y 100); los filtros `q`, `prioridad` y `estado` se aplican antes de paginar.

Benchmark local sobre PostgreSQL con 5.000 registros sintéticos: la consulta completa bajó de 276,37 ms de mediana (p95: 558,24 ms) a 19,52 ms (p95: 34,44 ms) para una página de 25 elementos, incluyendo conteo y resumen. Es una medición de una base local, no de Supabase ni una garantía de producción. Para repetirla, ejecuta `npm run benchmark` desde `BACK-END` con una base de pruebas.

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
