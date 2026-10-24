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
2. `controllers/autenticacion.controller.js` valida las credenciales contra PostgreSQL y compara la contraseña con su hash bcrypt.
3. Al iniciar sesión se firma un JWT de una hora con el identificador del usuario; no incluye su contraseña ni su hash.
4. `middleware/verificar_token.js` vuelve a consultar el usuario en PostgreSQL en cada solicitud autenticada. Las cuentas desactivadas dejan de aceptar inmediatamente los tokens existentes y los permisos reflejan el rol actual.
5. `GET /sesion` devuelve la identidad autenticada. Las rutas `/usuarios` requieren además el rol administrador.

El registro de incidentes sigue el mismo flujo: las rutas delegan en `controllers/incidentes.controller.js`, que valida la solicitud y utiliza `modelos/incidentes.model.js` para persistir en Prisma.

## Funciones

- Inicio de sesión con JWT y control de acceso por rol.
- Usuarios persistentes en PostgreSQL: creación, consulta, cambio de rol, activación, desactivación y eliminación por administradores.
- Contraseñas con hash bcrypt; el primer administrador se crea mediante variables secretas de entorno, sin credenciales predeterminadas.
- Protección para no desactivar, degradar ni eliminar al último administrador activo.
- Crear, listar, filtrar, consultar, actualizar y eliminar incidentes.
- Validar títulos de incidentes para aceptar únicamente letras y espacios (incluidas tildes y ñ).
- Listar incidentes en páginas de 25 elementos (máximo 100), con totales agregados.
- Adjuntar una imagen o un video al crear un incidente. Se admiten JPG, PNG, GIF, WebP, MP4, WebM y MOV, con un máximo de 25 MB por archivo.
- En desarrollo, los archivos se guardan en `BACK-END/uploads/`; en el despliegue gratuito se almacenan en un bucket privado de Supabase Storage. La descarga se realiza por una ruta protegida con JWT.
- Las respuestas HTTP superiores al umbral configurado usan compresión gzip/deflate.

## Requisitos y configuración

Se requiere Node.js, npm y una base PostgreSQL accesible. Configura `BACK-END/.env` con:

- `DATABASE_URL`: URL PostgreSQL usada por la aplicación.
- `DIRECT_URL`: URL PostgreSQL usada por las migraciones Prisma (puede ser igual a `DATABASE_URL`).
- `JWT_SECRET`: secreto usado para firmar JWT y proteger el certificado HTTPS local.
- `STORAGE_DRIVER=local` para desarrollo local, o `STORAGE_DRIVER=supabase` al desplegar.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_STORAGE_BUCKET` para Supabase Storage.
- `INITIAL_ADMIN_EMAIL` y `INITIAL_ADMIN_PASSWORD`: correo y contraseña (12–128 caracteres) del primer administrador. Son necesarios solo si la base de datos aún no tiene un administrador activo. Configúralos como secretos del entorno; nunca los envíes por chat ni los guardes en Git.

Para desarrollo local HTTPS se requiere `BACK-END/certs/localhost.pfx`; su frase de paso debe coincidir con `JWT_SECRET`. No publiques el archivo `.env`, el certificado, la clave service-role ni los archivos de `uploads`.

## Instalación y ejecución

Desde PowerShell, en la raíz del proyecto, configura las URLs de PostgreSQL en `.env` antes de ejecutar Prisma:

```powershell
cd BACK-END
npm install
npx prisma generate
npx prisma migrate deploy
npm run lint
npm test -- --test-force-exit --test-concurrency=1 --test-reporter=spec
npm start
```

El backend se inicia en `https://localhost:3000`, salvo que `PORT` esté definido en el entorno. El mismo servidor Express entrega el frontend estático desde `FRON_END/`. La base de datos de pruebas debe ser PostgreSQL separada de producción; `npm test` crea y elimina cuentas e incidentes temporales.

## Despliegue gratuito de demostración: Render + Supabase

La raíz incluye un `render.yaml` para desplegar el servicio web gratuito desde el repositorio. Los límites de los planes gratuitos pueden cambiar:

1. Crea un proyecto gratuito en Supabase.
2. En **Storage**, crea el bucket privado `evidencias-incidentes`. No lo hagas público: la API descarga cada archivo solo después de verificar el JWT.
3. En **Connect**, selecciona el **Session pooler** y copia la URI PostgreSQL. Úsala para `DATABASE_URL` y `DIRECT_URL`; en el formulario sustituye la contraseña de ejemplo por la contraseña de base de datos. No compartas estas cadenas ni la clave `service_role`.
4. En Supabase, copia la **Project URL** y la clave secreta `service_role` desde la configuración de API.
5. En Render, selecciona **New > Blueprint** y conecta `davidcabezas238-droid/PLATAFORMA-INCIDENTES.2.0`. Revisa y confirma el servicio gratuito `plataforma-incidentes`. El `Dockerfile` de la raíz incluye el backend y `FRON_END/`; el servicio aplica la migración Prisma al arrancar y usa `/healthz` como health check.
6. En las variables del servicio Render, completa `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` con los valores de Supabase. Conserva `STORAGE_DRIVER=supabase` y el nombre del bucket configurado por el Blueprint. `JWT_SECRET` se genera automáticamente.
7. En Render, configura `INITIAL_ADMIN_EMAIL` y `INITIAL_ADMIN_PASSWORD` como variables secretas del servicio y vuelve a desplegar. Usa una contraseña única de al menos 12 caracteres. En un servicio Blueprint ya creado, añade estas variables desde **Environment** si no aparecen al sincronizar el Blueprint.
8. Al iniciar, Render aplica la migración y crea el administrador solo si aún no existe uno activo. Comprueba que `/healthz` responda `200` y accede con el correo y contraseña configurados. Cuando el primer administrador ya se haya creado, elimina las variables `INITIAL_ADMIN_EMAIL` y `INITIAL_ADMIN_PASSWORD` de Render para reducir la exposición de secretos.
9. Espera a que termine el despliegue y abre la URL pública de Render. La primera respuesta puede tardar porque el servicio gratuito entra en suspensión tras 15 minutos sin tráfico.

Render termina HTTPS y reenvía las solicitudes al servidor HTTP dentro del contenedor. El health check `/healthz` también consulta PostgreSQL: devuelve `503` cuando no puede llegar a la base. Las solicitudes y errores se registran como JSON con identificador de solicitud; no se registran cuerpos ni contraseñas.

El plan gratuito de Supabase incluye 500 MB de base de datos y 1 GB de almacenamiento de archivos, y pausa los proyectos inactivos durante una semana. Render Free puede tardar aproximadamente un minuto en despertar; su disco es efímero, por lo que los adjuntos se guardan en Supabase Storage. Estos límites hacen que la combinación sirva para una demostración académica, no para producción.

La migración cambia la base de datos de MySQL a PostgreSQL y el almacenamiento de adjuntos a Supabase Storage. **No copia automáticamente los registros ni los archivos de la base de datos MySQL anterior**; la nueva base empieza vacía. Los archivos locales de `BACK-END/uploads/` tampoco se publican en Git y no se transfieren automáticamente.

`GET /incidentes` devuelve `{ items, total, page, pageSize, totalPages, resumen }`. Admite `page` y `pageSize` (entre 1 y 100); los filtros `q`, `prioridad` y `estado` se aplican antes de paginar.

Benchmark local sobre PostgreSQL con 5.000 registros sintéticos: la consulta completa bajó de 276,37 ms de mediana (p95: 558,24 ms) a 19,52 ms (p95: 34,44 ms) para una página de 25 elementos, incluyendo conteo y resumen. Es una medición de una base local, no de Supabase ni una garantía de producción. Para repetirla, ejecuta `npm run benchmark` desde `BACK-END` con una base de pruebas.

## Endpoints principales

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/login` | Validar credenciales y recibir JWT |
| `GET` | `/sesion` | Consultar el usuario autenticado |
| `GET` | `/usuarios` | Listar cuentas; requiere administrador |
| `POST` | `/usuarios` | Crear cuenta con `correo`, `clave` y `rol`; requiere administrador |
| `PATCH` | `/usuarios/:id` | Cambiar `rol` o `activo`; requiere administrador |
| `DELETE` | `/usuarios/:id` | Eliminar cuenta; requiere administrador |
| `GET` | `/incidentes` | Listar por página o filtrar con `q`, `prioridad` y `estado` |
| `POST` | `/incidentes` | Crear un incidente; acepta `multipart/form-data` y un archivo opcional en el campo `archivo` |
| `GET` | `/incidentes/:id/archivo` | Descargar un adjunto con JWT |
| `GET` | `/incidentes/:id` | Consultar un incidente |
| `PUT` | `/incidentes/:id` | Actualizar datos del incidente |
| `DELETE` | `/incidentes/:id` | Eliminar un incidente; requiere rol administrador |

Los endpoints de incidentes requieren `Authorization: Bearer <token>`.

## Validación

- GitHub Actions ejecuta lint, migraciones PostgreSQL y pruebas en cada push y pull request hacia `main`; consulta la pestaña **Actions** del repositorio. El workflow usa una base de datos efímera y no necesita secretos de producción.
- `npm run lint` analiza JavaScript del backend y frontend con ESLint.
- `npm test -- --test-force-exit --test-concurrency=1 --test-reporter=spec` ejecuta pruebas de reglas de negocio, usuarios, autorización, persistencia y adjuntos en serie. Requiere una base PostgreSQL de pruebas configurada en `BACK-END/.env`.
- `GET /healthz` comprueba disponibilidad de la aplicación y conectividad con PostgreSQL.

Consulta [la documentación técnica](./docs/ARQUITECTURA-TECNICA.md), [el manual de usuario](./docs/MANUAL-USUARIO.md), [la guía de defensa](./docs/DEFENSA.md), [la presentación](./docs/PRESENTACION.html) y [la lista de evidencias](./docs/EVIDENCIAS.md).
