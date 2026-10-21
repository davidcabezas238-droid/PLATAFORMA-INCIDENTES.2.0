# Documentación técnica

## Resumen

Plataforma web para registrar y administrar incidentes de seguridad. El frontend estático (HTML, CSS y JavaScript) y la API REST de Express se sirven desde el mismo origen. PostgreSQL guarda los incidentes y las cuentas; Supabase Storage conserva los adjuntos en un bucket privado.

## Componentes y flujo

1. El navegador envía credenciales a `POST /login`.
2. La API busca el correo normalizado en PostgreSQL y verifica la contraseña con bcrypt. Solo almacena el hash.
3. Si la autenticación es válida, la API firma un JWT con `sub` igual al ID del usuario y expiración de una hora.
4. El middleware valida firma y expiración, vuelve a leer al usuario y confirma que esté activo. De este modo, un cambio de rol o una desactivación se aplica en la siguiente solicitud.
5. El middleware de roles limita la gestión de cuentas y la eliminación de incidentes a administradores.
6. Prisma consulta PostgreSQL. Las migraciones versionadas están en `BACK-END/prisma/migrations/` y se aplican al arrancar el contenedor.
7. Los adjuntos se validan por contenido, se envían al bucket privado y se descargan mediante una ruta autenticada.

## Modelo de datos

### Usuario

| Campo | Tipo | Uso |
| --- | --- | --- |
| `id` | entero autoincremental | Identificador y sujeto del JWT |
| `correo` | texto único | Identificador de inicio de sesión |
| `clave` | texto | Hash bcrypt, nunca se devuelve por API |
| `rol` | texto | `admin` o `tecnico` |
| `activo` | booleano | Bloquea login y solicitudes autenticadas |
| `createdAt` | fecha/hora | Fecha de creación |

### Incidente

Registra título, descripción, prioridad, estado y metadatos del adjunto. La ruta interna del archivo no se incluye en respuestas públicas. El listado pagina por defecto a 25 filas y permite hasta 100 por página.

## Autenticación y autorización

- El JWT dura una hora y se envía como `Authorization: Bearer <token>`.
- Contraseñas de 12 a 128 caracteres se hashean con bcrypt (factor de coste 12).
- La API no almacena sesiones en el cliente ni confía en el rol incluido en un token antiguo: consulta rol y estado actuales en PostgreSQL.
- La administración de cuentas está reservada al rol `admin`.
- No se permite eliminar, desactivar ni degradar al último administrador activo; las comprobaciones de cambio se ejecutan en transacciones serializables.
- El primer administrador se provisiona con `INITIAL_ADMIN_EMAIL` y `INITIAL_ADMIN_PASSWORD`. No hay credenciales predeterminadas.

## Validación, errores y observabilidad

- Los títulos de incidentes aceptan letras Unicode y espacios, con límite de 100 caracteres.
- Se validan prioridad, estado, descripción y tipo/contenido/tamaño de adjuntos.
- Las respuestas de errores internos no revelan detalles al cliente; los logs JSON incluyen `requestId`, método, ruta, estado y duración.
- No se registran tokens, contraseñas ni cuerpos de solicitudes.
- `GET /healthz` comprueba la conectividad PostgreSQL y responde `503` si la base no está disponible.
- `compression` comprime respuestas mayores de 512 bytes.

## Despliegue y seguridad del transporte

- Render Free ejecuta el contenedor Docker y termina TLS/HTTPS delante de la aplicación.
- Supabase aloja PostgreSQL y el bucket privado para los adjuntos.
- Las URL y claves se configuran como variables de entorno en el panel del proveedor, nunca en Git.
- La migración `20261021000000_add_users` crea la tabla de cuentas. No importa usuarios ni datos del despliegue MySQL anterior.
- El disco del servicio Render Free es efímero; por eso los adjuntos de producción se guardan en Supabase Storage.

## Configuración

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Conexión PostgreSQL de la aplicación |
| `DIRECT_URL` | Sí en despliegue | Conexión PostgreSQL usada por migraciones |
| `JWT_SECRET` | Sí | Firma de tokens y certificado local |
| `PORT` | No | Puerto HTTP dentro del contenedor |
| `DATABASE_POOL_SIZE` | No | Límite del pool de conexiones |
| `STORAGE_DRIVER` | Sí | `local` en desarrollo o `supabase` en despliegue |
| `SUPABASE_URL` | Con Supabase Storage | URL del proyecto |
| `SUPABASE_SERVICE_ROLE_KEY` | Con Supabase Storage | Clave secreta del servicio |
| `SUPABASE_STORAGE_BUCKET` | Con Supabase Storage | Bucket privado |
| `INITIAL_ADMIN_EMAIL` | Condicional | Correo del primer administrador |
| `INITIAL_ADMIN_PASSWORD` | Condicional | Contraseña de 12–128 caracteres del primero |

Para crear el administrador inicial, configura ambas variables a la vez. Una vez creado, elimina ambas del servicio; no cambian contraseñas ni sobrescriben cuentas existentes.

## Validación local

Usa una base de datos **de pruebas**, no producción. Define `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` y `STORAGE_DRIVER=local` en `BACK-END/.env`, instala dependencias y aplica migraciones:

```powershell
cd BACK-END
npm install
npx prisma generate
npx prisma migrate deploy
npm run lint
npm test -- --test-force-exit --test-reporter=spec
```

La suite crea cuentas e incidentes únicos y los elimina al finalizar. La comprobación de conectividad no sustituye pruebas de carga, recuperación ante desastres ni auditoría externa.

## Límites conocidos

- Los niveles gratuitos pueden suspender servicios, limitar recursos o cambiar sus condiciones.
- No hay recuperación de contraseña ni cambio autónomo, segundo factor, historial/auditoría administrativa, backups gestionados por la aplicación ni alta disponibilidad.
- La invalidación inmediata de tokens consulta PostgreSQL en cada petición, lo cual añade una consulta y hace depender la autenticación de la base.
- La URL pública debe verificarse desde Render antes de incluirse en la entrega; no debe inventarse ni inferirse del nombre del servicio.
