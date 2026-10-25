# Plataforma de incidentes

Aplicación de registro de incidentes de seguridad. El frontend es HTML, CSS y JavaScript modular; el backend es una API Express que utiliza Prisma 7 y PostgreSQL administrado por Render. Supabase Storage mantiene los adjuntos en un bucket privado.

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

## Despliegue gratuito de demostración: Render PostgreSQL + Supabase Storage

La raíz incluye un `render.yaml` para desplegar el servicio web y la base PostgreSQL administrada por Render. Supabase se utiliza únicamente para el bucket privado de adjuntos. **La base gratuita de Render vence a los 30 días**; después queda inaccesible hasta actualizarla a un plan pagado y, tras el periodo de gracia de Render, se elimina junto con sus datos. Comprueba las condiciones actuales antes de usarla:

1. En Supabase, conserva el proyecto existente y el bucket privado `evidencias-incidentes`. Supabase ya no alojará la base de datos de esta plataforma; seguirá guardando adjuntos. No hagas público el bucket: la API descarga cada archivo solo después de verificar el JWT.
2. En Render, abre el Blueprint vinculado al repositorio `davidcabezas238-droid/PLATAFORMA-INCIDENTES.2.0`, rama `main`, y selecciona sincronizar/aplicar los cambios del Blueprint. Revisa que aparezca la base PostgreSQL gratuita nueva `plataforma-incidentes-db` junto con el servicio `plataforma-incidentes`. No basta con hacer un despliegue manual del servicio: debe aplicarse el recurso nuevo del Blueprint.
3. Antes de confirmar, verifica que `INITIAL_ADMIN_EMAIL` y `INITIAL_ADMIN_PASSWORD` estén definidas como variables secretas en el Environment del servicio web. La nueva base inicia vacía y necesita esas variables para crear el primer administrador. Usa una contraseña única de al menos 12 caracteres; nunca la compartas en el chat.
4. En el Environment del servicio, conserva `STORAGE_DRIVER=supabase`, el bucket `evidencias-incidentes` y completa `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` usando la Project URL y la clave secreta `service_role` de Supabase. No compartas ni publiques estas credenciales. `JWT_SECRET` se genera automáticamente.
5. Confirma la sincronización del Blueprint. Render crea PostgreSQL y configura las conexiones; el contenedor aplica las migraciones Prisma al arrancar. Espera a que la base y el servicio estén disponibles, comprueba `/healthz` y luego inicia sesión con las credenciales iniciales.
6. Cuando hayas confirmado que el administrador puede iniciar sesión, elimina `INITIAL_ADMIN_EMAIL` y `INITIAL_ADMIN_PASSWORD` del servicio y vuelve a desplegar.

Render termina HTTPS y reenvía las solicitudes al servidor HTTP dentro del contenedor. El health check `/healthz` también consulta PostgreSQL: devuelve `503` cuando no puede llegar a la base. Las solicitudes y errores se registran como JSON con identificador de solicitud; no se registran cuerpos ni contraseñas.

Render Free puede tardar aproximadamente un minuto en despertar y su disco de servicio es efímero; por eso los adjuntos permanecen en Supabase Storage. La base de datos gratuita Render tiene 1 GB y expira a los 30 días; al expirar, queda inaccesible hasta actualizarla y puede ser eliminada al acabar el periodo de gracia. Esta combinación sirve solo para una demostración académica, no para producción. Conserva una exportación independiente de cualquier dato que necesites antes de la fecha de expiración.

La nueva base de Render empieza vacía: **no importa automáticamente los usuarios ni los incidentes que actualmente estén en la base PostgreSQL de Supabase**. La base antigua no se borra y se puede consultar desde Supabase, pero la aplicación dejará de usarla tras el cambio. Los metadatos de adjuntos tampoco se copian; los objetos existentes siguen en el bucket de Supabase, pero no estarán vinculados a incidentes en la base nueva. Los archivos locales de `BACK-END/uploads/` tampoco se publican en Git ni se transfieren automáticamente.

La conexión con Render PostgreSQL es solo para esta nueva base de datos. La suite automatizada de GitHub Actions sigue usando su propio PostgreSQL efímero de prueba; no conecta a la base de producción.

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

## Integración y despliegue continuo (CI/CD)

El workflow `.github/workflows/ci.yml` implementa dos etapas encadenadas:

1. **CI:** en pushes y pull requests a `main`, levanta PostgreSQL efímero, instala dependencias con `npm ci`, genera Prisma Client, ejecuta migraciones, ESLint y pruebas. Los pull requests solo validan; no despliegan.
2. **CD:** únicamente después de que CI pase en un push a `main` o una ejecución manual de `workflow_dispatch` en `main`, valida el servicio y Auto-Deploy de Render, solicita desplegar exactamente el commit validado, espera el estado `live`, confirma el SHA del despliegue y consulta `/healthz`. Un fallo de configuración, despliegue, SHA o health check hace fallar el job.

El servicio de Render debe tener **Auto-Deploy desactivado**. El Blueprint declara `autoDeployTrigger: "off"` para que los pushes no desplieguen por fuera de GitHub Actions; el workflow CD es el único que inicia despliegues automáticos. En la primera activación, cambia Auto-Deploy a **Off** en **Render → servicio `plataforma-incidentes` → Settings** antes de publicar el workflow. Luego sincroniza el Blueprint para que Render aplique y mantenga esta configuración. No desactives el health check `/healthz`.

### Configurar GitHub y Render

Antes de publicar el workflow en `main`:

1. En Render, abre **Settings** del servicio web y cambia **Auto-Deploy** a **Off**. Mantén conectado el servicio al repositorio y a la rama `main`; el cambio impide que Render publique antes de que CI pase.
2. En GitHub, abre **Settings → Environments** y crea un entorno llamado `production`.
3. En los secretos del entorno `production`, agrega:

   - `RENDER_API_KEY`: API key de Render. Trátala como credencial de producción; no la pegues en el repositorio, YAML, logs, capturas ni chat. Si el workspace permite limitar su alcance, usa el mínimo necesario.
   - `RENDER_SERVICE_ID`: identificador del servicio web de Render `plataforma-incidentes` (no el ID de la base PostgreSQL).

4. Publica el workflow y el Blueprint actualizado en `main`. En Render, sincroniza el Blueprint y comprueba que Auto-Deploy siga en **Off**.
5. En **GitHub → Actions**, confirma que `Lint and test` termina correctamente y después que `Deploy to Render` verifica el SHA y el health check.

Si necesitas ejecutar el pipeline sin hacer un nuevo push, abre **Actions → CI/CD → Run workflow** y selecciona `main`. Esta ejecución vuelve a ejecutar CI y, si pasa, despliega ese mismo commit. Los pull requests nunca ejecutan el deploy. Protege `main` y exige el check `Lint and test` antes de permitir merges. No uses secretos de producción en pull requests de forks.

Si faltan secretos, el job CD falla explícitamente. Hasta que se configure el entorno `production`, se desactive y sincronice Auto-Deploy y se complete un run exitoso de ambos jobs, **el CD no está operativo/verificado en remoto**. El código del workflow por sí solo no configura secretos ni modifica el panel de Render. Guarda el enlace del run y el SHA como evidencia.

## Validación

- GitHub Actions ejecuta lint, migraciones PostgreSQL y pruebas en cada push y pull request hacia `main`; consulta la pestaña **Actions** del repositorio. El job CI usa una base de datos efímera y no necesita secretos de producción.
- `npm run lint` analiza JavaScript del backend y frontend con ESLint.
- `npm test -- --test-force-exit --test-concurrency=1 --test-reporter=spec` ejecuta pruebas de reglas de negocio, usuarios, autorización, persistencia y adjuntos en serie. Requiere una base PostgreSQL de pruebas configurada en `BACK-END/.env`.
- `GET /healthz` comprueba disponibilidad de la aplicación y conectividad con PostgreSQL.

Consulta la [documentación técnica](./docs/ARQUITECTURA-TECNICA.md), el [manual de usuario](./docs/MANUAL-USUARIO.md) y la [presentación](./docs/PRESENTACION.html).
