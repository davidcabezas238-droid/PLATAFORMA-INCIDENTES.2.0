# Evidencias de la entrega

Registro actualizado el **24 de octubre de 2026**. Distingue entre comprobaciones públicas, resultados automatizados y capturas que todavía debe tomar una persona desde sus paneles autenticados. La evidencia listada abajo corresponde a la versión comprobada antes de aplicar el cambio de base a Render; no afirma que la nueva base ya exista o esté conectada. No se presentan capturas ficticias.

## Identificación de la versión

- **URL pública:** [https://plataforma-incidentes-ggeo.onrender.com](https://plataforma-incidentes-ggeo.onrender.com)
- **Repositorio:** [PLATAFORMA-INCIDENTES.2.0](https://github.com/davidcabezas238-droid/PLATAFORMA-INCIDENTES.2.0)
- **Rama:** `main`
- **Último commit con CI aprobada antes de migrar la base:** [`e89f9c9`](https://github.com/davidcabezas238-droid/PLATAFORMA-INCIDENTES.2.0/commit/e89f9c990369f313c10df9374413494b5c683744)
- **Ejecución CI:** [GitHub Actions — CI exitosa](https://github.com/davidcabezas238-droid/PLATAFORMA-INCIDENTES.2.0/actions/runs/40122201733)
- **Documentación técnica:** [ARQUITECTURA-TECNICA.md](./ARQUITECTURA-TECNICA.md)
- **Manual de usuario:** [MANUAL-USUARIO.md](./MANUAL-USUARIO.md)
- **Guion de defensa:** [DEFENSA.md](./DEFENSA.md)
- **Presentación:** [PRESENTACION.html](./PRESENTACION.html)

## Matriz de evidencias

| Evidencia | Referencia / resultado | Estado |
| --- | --- | --- |
| Sitio público accesible mediante HTTPS | [Abrir plataforma](https://plataforma-incidentes-ggeo.onrender.com); verificación HTTP `200` el 24-10-2026 | **Verificada en vivo** |
| Repositorio versionado y rama de entrega | [Repositorio](https://github.com/davidcabezas238-droid/PLATAFORMA-INCIDENTES.2.0), rama `main`, commit [`e89f9c9`](https://github.com/davidcabezas238-droid/PLATAFORMA-INCIDENTES.2.0/commit/e89f9c990369f313c10df9374413494b5c683744) | **Verificada en remoto** |
| Despliegue actual disponible | El sitio sirve la aplicación desde Render; respuestas HTTPS `200` observadas el 24-10-2026 | **Verificado en vivo** |
| Blueprint con base PostgreSQL Render | El archivo `render.yaml` declara `plataforma-incidentes-db` y la conexión de `DATABASE_URL`/`DIRECT_URL` | **Cambio preparado; falta aplicar/sincronizar en Render y verificar la nueva base** |
| Health check | [`/healthz`](https://plataforma-incidentes-ggeo.onrender.com/healthz) respondió `200` y `{"status":"ok"}` el 24-10-2026 | **Verificado en vivo** |
| Página de acceso y administración | [`/login.html`](https://plataforma-incidentes-ggeo.onrender.com/login.html) y [`/usuarios.html`](https://plataforma-incidentes-ggeo.onrender.com/usuarios.html) respondieron `200` | **Verificadas en vivo** |
| Protección de la API de usuarios | [`/usuarios`](https://plataforma-incidentes-ggeo.onrender.com/usuarios) respondió `401` sin token el 24-10-2026 | **Verificada en vivo** |
| Inicio de sesión como administrador | El usuario confirmó que pudo iniciar sesión y ver los incidentes. No se guarda una captura para evitar exponer correo o sesión | **Confirmado por el usuario** |
| CRUD persistente de incidentes | Las pruebas automatizadas de integración pasaron en CI. La persistencia de un registro real tras recargar la aplicación debe capturarse durante la demostración | **Pruebas CI aprobadas; captura manual pendiente** |
| Alta, administración y permisos de usuarios | Las pruebas de integración de usuarios y autorización pasaron en CI. Crear una cuenta técnica en producción y tomar captura queda pendiente | **Pruebas CI aprobadas; demostración en vivo pendiente** |
| Restricción del rol técnico | Autorización cubierta por las pruebas automatizadas aprobadas. Falta captura desde una sesión real de técnico | **Pruebas CI aprobadas; captura manual pendiente** |
| Adjunto consultado con autenticación | El flujo de carga/descarga autenticada está cubierto por pruebas automatizadas; no se ha registrado evidencia de una demostración en producción | **Pruebas CI aprobadas; captura manual pendiente** |
| Lint, migraciones y suite de pruebas | [Ejecución CI `40122201733`](https://github.com/davidcabezas238-droid/PLATAFORMA-INCIDENTES.2.0/actions/runs/40122201733), commit `e89f9c9`: conclusión `success` | **Verificada; CI aprobada** |
| Bucket privado de Supabase | La configuración debe verificarse en el panel autenticado de Supabase. No se dispone aquí de una captura del panel | **Captura del panel pendiente** |
| Logs del servicio y estado Live en Render | La aplicación y su health check responden, pero no se ha capturado la vista autenticada de logs/despliegue de Render | **Captura del panel pendiente** |
| Documentación técnica y manual | [Documentación técnica](./ARQUITECTURA-TECNICA.md) y [manual de usuario](./MANUAL-USUARIO.md) incluidos en el repositorio | **Completados** |
| Presentación y ensayo de demostración | [Presentación](./PRESENTACION.html) y [guion](./DEFENSA.md) disponibles. El ensayo debe realizarse antes de la exposición | **Material completado; ensayo pendiente** |

## Capturas que faltan para cerrar la carpeta de entrega

Desde las sesiones autenticadas correspondientes, guarda capturas sin contraseñas, tokens, claves, correos privados ni datos personales:

1. Render: servicio en estado **Live** y despliegue del commit que aplica el nuevo PostgreSQL; captura también el recurso `plataforma-incidentes-db`.
2. Supabase: bucket `evidencias-incidentes` configurado como privado; encuadra el nombre y la privacidad, no las claves.
3. Aplicación: inicio de sesión, creación de un incidente de demostración y el mismo registro todavía presente tras recargar.
4. Administración: alta de una cuenta técnica y rechazo de una acción administrativa para esa cuenta.
5. Adjunto de prueba consultado desde una sesión autenticada, usando contenido no sensible.
6. Actions: pantalla de la ejecución CI con resultado exitoso.
7. Presentación: ensayo de la demostración completa.

Marca estas capturas como realizadas únicamente después de observarlas. Los resultados de CI prueban los casos automatizados, pero no sustituyen capturas de una demostración en producción.
