# Manual de usuario

## Acceso inicial

1. Abre la URL HTTPS asignada por Render.
2. Inicia sesión con el correo y la contraseña del primer administrador, configurados de forma privada en el entorno de Render.
3. Si la página muestra error de conexión, espera unos segundos y vuelve a intentar: el servicio gratuito puede estar despertando.

No compartas tu contraseña ni el token de sesión. Cierra sesión al terminar, especialmente en dispositivos compartidos.

## Registrar un incidente

1. En el panel de incidentes, completa el título con letras y espacios; no se aceptan números ni símbolos.
2. Añade una descripción clara, selecciona prioridad y estado.
3. Si corresponde, adjunta una imagen o video de hasta 25 MB.
4. Selecciona **Registrar incidente**. El nuevo caso aparecerá en el listado.

Los formatos admitidos para archivos son JPG, PNG, GIF, WebP, MP4, WebM y MOV. El sistema valida el contenido, no solo la extensión.

## Consultar y actualizar

- Usa el cuadro de búsqueda y los filtros para encontrar incidentes.
- El listado muestra resultados paginados. Usa los controles para pasar de página.
- Abre un registro para revisar sus datos y, según el rol, actualizar su estado o eliminarlo.
- Los archivos adjuntos se sirven desde una ruta protegida por autenticación.

## Administrar usuarios (solo administrador)

1. Selecciona **Usuarios** desde la navegación.
2. Para crear una cuenta, escribe el correo, define una contraseña segura de al menos 12 caracteres y selecciona el rol.
3. Comunica las credenciales por un canal seguro. No las publiques en mensajes o documentos visibles.
4. En la tabla puedes guardar un cambio de rol, activar/desactivar una cuenta o eliminarla.
5. Si desactivas una cuenta, esta pierde acceso inmediatamente, incluso si tenía un token sin expirar.

No puedes eliminar, desactivar ni quitar el rol de administrador a tu propia cuenta desde esa sesión. El sistema tampoco permite dejar la plataforma sin un administrador activo.

## Roles

| Acción | Técnico | Administrador |
| --- | :---: | :---: |
| Iniciar sesión y consultar la sesión propia | Sí | Sí |
| Crear, consultar y actualizar incidentes | Sí | Sí |
| Eliminar incidentes | No | Sí |
| Listar, registrar, modificar y eliminar usuarios | No | Sí |

## Errores frecuentes

- **Credenciales inválidas:** confirma el correo y solicita al administrador que verifique el estado de la cuenta.
- **No autorizado:** inicia sesión de nuevo. Las sesiones duran una hora.
- **No tienes permisos:** solicita a un administrador el rol requerido.
- **El servicio tarda en responder:** Render Free puede despertar tras un periodo sin uso; espera y reintenta.
- **Adjunto rechazado:** verifica formato, contenido real y límite de 25 MB.

## Limitaciones

La versión gratuita puede suspenderse o alcanzar sus límites. No se deben cargar datos sensibles o información real de personas sin autorización institucional. Esta versión no tiene recuperación automática ni cambio autónomo de contraseña. Si una cuenta técnica pierde acceso, coordina con el administrador la creación de una cuenta de reemplazo y la desactivación de la anterior. La recuperación de una cuenta administradora requiere un procedimiento operativo controlado, fuera de la interfaz.
