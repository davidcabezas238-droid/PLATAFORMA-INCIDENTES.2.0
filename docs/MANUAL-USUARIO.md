# Manual de usuario

**Plataforma de gestión de incidentes**

**Versión del manual:** 1.1

**Fecha:** 24 de octubre de 2026

Este manual explica cómo acceder a la plataforma, registrar y consultar incidentes y, para las cuentas administradoras, gestionar usuarios. La interfaz y los nombres de botones pueden cambiar en versiones futuras.

## 1. Acceso a la plataforma

1. Abre [https://plataforma-incidentes-ggeo.onrender.com](https://plataforma-incidentes-ggeo.onrender.com) en un navegador actualizado.
2. Si aparece el aviso de acceso requerido, selecciona **Iniciar sesión**.
3. Escribe el correo y la contraseña que te proporcionó el administrador y selecciona **Ingresar**.
4. Al validar las credenciales, se abre el registro operativo de incidentes.

No hay registro público de cuentas. Si no tienes credenciales o no puedes iniciar sesión, comunícate con el administrador de la plataforma. No compartas tu contraseña ni guardes credenciales en documentos o capturas.

## 2. Conocer el registro operativo

El panel principal contiene:

- **Total registrados**, **Registrados**, **En revisión** y **Resueltos**: resumen de los incidentes que coinciden con la búsqueda y los filtros actuales.
- **Incidentes**: listado con título, prioridad, estado y acciones disponibles según tu rol.
- **Buscar**: encuentra texto en el título, la descripción, la prioridad o el estado.
- **Prioridad** y **Estado**: reducen los resultados a los valores seleccionados. Puedes combinar búsqueda y filtros.
- **Anterior** y **Siguiente**: cambian de página cuando hay más resultados. Se muestran hasta 25 incidentes por página.
- **Actualizar**: vuelve a cargar el listado.

Si ningún registro coincide con los criterios, el panel indica que no hay incidentes para esos filtros. Borra el texto de búsqueda o selecciona **Todas** y **Todos** para ver nuevamente el registro completo.

## 3. Registrar un incidente

1. Selecciona **Nuevo incidente**.
2. Completa el título con un nombre descriptivo. Admite letras y espacios, incluidas tildes y ñ; no admite números ni símbolos, y tiene un máximo de 100 caracteres.
3. Escribe una descripción clara. Es opcional; puede tener hasta 200 palabras y 1.200 caracteres.
4. Selecciona una prioridad:
   - **Baja**
   - **Media**
   - **Alta**
   - **Crítica**
5. Selecciona el estado inicial: **Registrado**, **En revisión** o **Resuelto**. Normalmente, un caso nuevo comienza como **Registrado**.
6. Si es necesario, adjunta una imagen o un video compatible. El límite es 25 MB por archivo.
7. Selecciona **Guardar**. Si los datos son válidos, aparecerá el mensaje **Incidente registrado** y el nuevo caso se mostrará en el listado.

Formatos admitidos: JPG, PNG, GIF, WebP, MP4, WebM y MOV. El sistema valida el contenido del archivo; cambiar solo su extensión no hace que un formato no admitido sea válido. El adjunto se puede incorporar al crear el incidente; no se puede reemplazar desde el formulario de edición.

## 4. Consultar y actualizar incidentes

1. Busca el caso por una palabra de su título o descripción, o usa los filtros de prioridad y estado. Los criterios seleccionados se aplican conjuntamente.
2. Si hay varias páginas, usa **Anterior** y **Siguiente** para recorrer los resultados.
3. En la fila del incidente, selecciona **Editar**.
4. Actualiza el título, la descripción, la prioridad o el estado.
5. Selecciona **Guardar**. La plataforma confirmará **Incidente actualizado** y refrescará el listado.

El rol técnico y el administrador pueden crear, consultar y actualizar incidentes. Solo el administrador puede eliminarlos.

## 5. Eliminar un incidente

Esta acción está disponible únicamente para administradores.

1. Busca el incidente correcto y comprueba sus datos.
2. Selecciona **Eliminar** en su fila.
3. Confirma la acción solo si deseas borrarlo.

La eliminación es permanente desde la interfaz. Si no estás seguro, cancela el cuadro de confirmación.

## 6. Administrar cuentas (solo administrador)

Selecciona **Usuarios** en la barra superior. Si no aparece el enlace, tu cuenta no tiene permisos de administración.

### Crear una cuenta

1. En **Registrar usuario**, introduce un correo electrónico válido.
2. Define una contraseña única de entre 12 y 128 caracteres.
3. Selecciona **Técnico** o **Administrador**. Se selecciona **Técnico** por defecto.
4. Selecciona **Registrar usuario**. La cuenta nueva queda activa.
5. Comparte las credenciales con su titular por un canal seguro. No las incluyas en capturas, repositorios ni mensajes públicos.

Cada correo solo puede pertenecer a una cuenta. La interfaz no ofrece recuperación ni cambio de contraseña.

### Cambiar el rol, activar o desactivar una cuenta

- **Guardar rol**: selecciona el rol deseado en la lista de la cuenta y luego presiona **Guardar rol**.
- **Desactivar**: bloquea el acceso de esa cuenta. Sus sesiones existentes dejan de ser válidas.
- **Activar**: vuelve a permitir el acceso a una cuenta desactivada.

### Eliminar una cuenta

Selecciona **Eliminar** en la fila correspondiente y confirma. No puedes eliminar, desactivar ni quitarte el rol de administrador desde tu propia sesión. Además, siempre debe quedar al menos un administrador activo; la plataforma rechazará una acción que deje el sistema sin uno.

## 7. Roles y permisos

| Operación | Técnico | Administrador |
| --- | :---: | :---: |
| Iniciar sesión y consultar incidentes | Sí | Sí |
| Crear y actualizar incidentes | Sí | Sí |
| Eliminar incidentes | No | Sí |
| Consultar y gestionar cuentas de usuario | No | Sí |

Los permisos se aplican en el servidor. Si una acción no está disponible para tu rol, solicita la ayuda de un administrador; ocultar o cambiar elementos de la interfaz no concede permisos adicionales.

## 8. Cerrar sesión y proteger la cuenta

1. Selecciona **Cerrar sesión** en la parte superior del panel.
2. En un dispositivo compartido, cierra también la pestaña del navegador.
3. No compartas contraseñas ni capturas que contengan datos personales.

La sesión vence después de una hora. Si permanece inactiva o deja de ser válida, vuelve a iniciar sesión.

## 9. Solución de problemas

| Mensaje o situación | Qué hacer |
| --- | --- |
| Credenciales inválidas | Comprueba el correo y la contraseña. Si el problema continúa, pide al administrador que revise el estado de la cuenta. |
| Sesión vencida o acceso no autorizado | Inicia sesión de nuevo. |
| No tienes permisos | Solicita al administrador una cuenta o un rol apropiado para la tarea. |
| El servicio tarda en responder o no conecta | La instancia gratuita de Render puede tardar en activarse después de un periodo sin uso. Espera y reintenta; si continúa, informa al responsable del servicio. |
| No aparecen incidentes | Borra la búsqueda y restablece los filtros de prioridad y estado. |
| El título no se acepta | Usa solo letras y espacios; revisa que no contenga números ni signos. |
| El adjunto es rechazado | Comprueba el formato, que el archivo sea realmente una imagen o video admitido y que no supere 25 MB. |
| El correo ya está registrado | Pide al administrador que verifique la cuenta existente; no es posible crear otra con el mismo correo. |
| No puedes desactivar o eliminar una cuenta | Comprueba que no sea tu propia cuenta y que la operación no retire al último administrador activo. |

## 10. Uso responsable y limitaciones

Esta instancia gratuita es una demostración académica, no un servicio institucional de producción. Puede tener interrupciones, límites de uso o suspensión. No ingreses información personal, confidencial o real de una organización sin autorización y controles aprobados.

La aplicación no ofrece registro público ni recuperación automática de contraseñas. La administración de cuentas y cualquier recuperación deben coordinarse con el responsable de la plataforma. Antes de usarla con usuarios o datos institucionales se requieren controles operativos, respaldo y retención de datos, responsables definidos y una revisión de seguridad y privacidad.
