# Guion para la defensa

## Demostración sugerida (5–7 minutos)

1. **Arquitectura (1 min):** presenta navegador + Express, PostgreSQL mediante Prisma y Supabase Storage privado; Render termina HTTPS.
2. **Acceso (1 min):** inicia sesión como administrador, muestra `/sesion` sin exponer el token.
3. **CRUD de incidentes (1–2 min):** registra un caso, búsquelo, actualiza su estado y elimínalo. Si la rúbrica exige conservar evidencia, usa un incidente de demostración y no lo borres hasta tomarla.
4. **Adjunto (1 min):** registra un archivo de prueba, muestra que puede consultarse autenticado y que una solicitud sin token no lo obtiene.
5. **Autorización (1 min):** abre otra sesión como técnico e intenta acceder a la administración de usuarios o borrar un incidente; muestra la respuesta de acceso denegado.
6. **Persistencia y health (1 min):** recarga para demostrar persistencia y enseña `GET /healthz` con estado saludable. No muestres claves, contraseñas ni datos personales.

## Preguntas de defensa y respuestas breves

### ¿Cómo se organiza la arquitectura?

El navegador consume endpoints REST que Express organiza en rutas, controladores, middleware y modelos. Prisma centraliza el acceso tipado a PostgreSQL. Los archivos se guardan aparte en un bucket privado.

### ¿Dónde están las contraseñas?

Solo almacenamos hashes bcrypt con coste 12. El login compara la contraseña con ese hash. Ni la API ni el JWT incluyen el hash.

### ¿Cómo se autoriza a los usuarios?

El JWT identifica al usuario mediante `sub`; el backend verifica firma y expiración y consulta cuenta, estado y rol actuales desde PostgreSQL en cada solicitud. Las operaciones administrativas verifican el rol `admin`.

### ¿Qué ocurre al desactivar una cuenta?

El próximo request autenticado consulta la base, observa `activo=false` y responde `401`; no es necesario esperar a que venza el JWT.

### ¿Cómo evita la pérdida del último administrador?

Las modificaciones y eliminaciones del modelo verifican la cantidad de administradores activos dentro de una transacción serializable. La API también impide que la persona quite privilegios o elimine su propia cuenta.

### ¿Qué validaciones tiene el sistema?

Se validan campos y longitudes, correo, rol, contraseña, prioridad, estado, título, descripción y contenido de adjuntos. La validación se hace en servidor; la del navegador solo mejora la experiencia.

### ¿Cómo se despliega y cómo se cifra el tráfico?

El Blueprint configura el contenedor de Render y las variables de entorno; las migraciones se aplican al iniciar. Render termina TLS y entrega HTTPS en el dominio público. El bucket de Supabase es privado.

### ¿Cómo se comprueba el estado del sistema?

`/healthz` consulta PostgreSQL y devuelve `200` si responde o `503` si no. Los logs JSON incluyen un ID de solicitud, estado HTTP y duración, sin registrar credenciales ni cuerpo.

### ¿Qué pruebas hay?

ESLint verifica calidad estática y `node:test` cubre validaciones, persistencia y autorización de usuarios, sesión y flujo de adjuntos. Las pruebas de integración requieren una base PostgreSQL aislada.

### ¿Qué limitaciones quedan?

Los planes gratuitos pueden dormir, limitar recursos o cambiar condiciones. No hay segundo factor, flujo de recuperación/cambio autónomo de contraseña, auditoría administrativa completa ni garantías de alta disponibilidad o backups de producción. El despliegue es una demostración académica, no un servicio productivo.

## Evidencia antes de entregar

Completa la lista de [evidencias](./EVIDENCIAS.md) con capturas reales. Sustituye la URL pendiente solo después de copiarla del panel de Render y comprobarla en navegador.
