# Lliga Catalana multiclub: auditoría y plan

Este documento describe cómo funciona hoy el acceso a la app y qué hace falta para que varios clubes la usen, cada uno con su propio entorno. Al final está el plan por fases y qué incluye este cambio.

## 1. Auditoría del sistema actual

### Autenticación
- Firebase Authentication con Google (`signInWithPopup` o, si el navegador lo bloquea, `signInWithRedirect`). Las reglas exigen el correo verificado.
- La sesión vive en Firebase Auth (IndexedDB del navegador). Firestore guarda una copia local de los datos leídos (`enablePersistence`), que **no se borraba al cerrar sesión**.
- Al cerrar sesión, `B.onAuth(null)` vaciaba parte del estado, pero no cancelaba todas las escuchas (gestión del club, documentos, MVP) ni borraba en memoria fotos, perfiles, teléfonos y configuración.
- Un gestor sin ficha de jugador no tenía botón para cerrar sesión (corregido el 12/11, commit 8d77acd).

### Usuarios y roles
| Rol | Dónde se guarda | Cómo se concede |
| --- | --- | --- |
| Administrador | `admins/{uid o correo}` | A mano en la consola de Firebase |
| Gestor deportivo | `meta/app.managerEmails` | Un administrador lo añade en Configuración |
| Capitán | `seasons/{temporada}.captains` (lista de jugadores) | Gestión o administrador, por temporada y equipo |
| Jugador | `users/{uid}.pid` + `claims/{pid}` | **El propio usuario elige su nombre de una lista** |

Problema de seguridad: cualquiera con un Gmail puede elegir el nombre de un jugador que aún no lo ha elegido y, con él, leer y escribir los datos del equipo. Las reglas solo impiden que dos Gmail elijan el mismo nombre.

### Datos
Todo está en colecciones de la raíz y es de un único club (el Real Club de Polo):
`meta/app`, `public/roster`, `claims`, `users`, `profiles`, `photos`, `phones`, `pushTokens`, `reports`, `seasons/{temporada[-equipo]}` con sus subcolecciones (`avail`, `availNotes`, `picks`, `ballots`, `docs`, `snapshots`, `mvp`).

Las funciones de Vercel (`api/*`) usan la cuenta de servicio y leen esas mismas rutas.

### Identidad visual
`club-config.js` fija nombre, escudo, abreviaturas, equipos y grupos de la FCT. Los colores están en `styles.css` como variables (`--green`, `--green2`, `--brass`, `--brassLine`, `--gold`). El nombre interno del equipo propio en los calendarios es `polo` para todos los clubes.

### Catálogo de clubes de la FCT
- La web pública de la FCT tiene un buscador de clubes ([clubs](https://fctennis.cat/clubs/)) que hoy no devuelve resultados, y la página de [clubs afiliats](https://fctennis.cat/clubs-afiliats/) solo muestra un club.
- El **portal oficial de la FCT** (`portal.fctennis.cat`) sí tiene un servicio de clubes: `api/club.do`, acción `buscar`, el mismo que usa su buscador de clubes. Devuelve los clubes afiliados (unos 320) con código FCT, nombre oficial, nombre corto, dirección, localidad, provincia, web y un campo `logo` que hoy viene vacío.
- La app lo consulta desde `api/fct-clubs.js` (Vercel), quita cuentas que no son clubes (independents, escuelas, bajas) y lo guarda en caché un día.
- **Escudos**: la FCT no los publica. Se usa, por este orden: el escudo configurado del club (el del Polo), el que cargue la plataforma (CSV/Excel con `codigo` y `escudo`), el logo de la FCT si algún día lo publica, y el icono de la web oficial que figura en la FCT. Si no hay ninguno, iniciales.

## 2. Modelo de datos objetivo

```
catalog/{clubId}                      catálogo FCT importado: nombre oficial, localidad, provincia, web, origen, fecha
clubs/{clubId}                        identidad y configuración: nombre, corto, escudo, colores, contacto, grupos FCT, temporada
clubs/{clubId}/members/{uid}          vínculo usuario-club: roles, jugador (pid), equipos, quién lo autorizó y cuándo
clubs/{clubId}/invites/{código}       invitaciones de jugador, capitán o gestor
clubs/{clubId}/(meta, public, claims, profiles, photos, phones, pushTokens, reports, seasons/...)   los datos de hoy, por club
clubRequests/{id}                     solicitudes de gestores para vincularse a un club y su resolución
users/{uid}                           cuenta: club actual, último rol con el que entró
admins/{uid}                          administradores de la plataforma
```

Un usuario tiene una sola cuenta y una sola ficha de jugador por club, aunque juegue en varios equipos o tenga varios roles: los roles se suman en `members/{uid}.roles` y los equipos salen de las plantillas.

## 3. Reglas de acceso (servidor)
- Cada regla de un club comprueba que el usuario es miembro de **ese** club (`clubs/{clubId}/members/{uid}`), con el rol necesario. Un gestor de un club no puede leer ni escribir otro.
- Seleccionar un rol en la pantalla de acceso no concede nada: el rol se comprueba contra la base de datos en el cliente y, sobre todo, en las reglas.
- Vincularse a un equipo exige una invitación válida (código o enlace) de un capitán, gestor o administrador.
- Ser gestor exige una solicitud aprobada por un administrador (o una invitación de gestor), con registro de quién la autorizó.

## 4. Plan por fases

### Recorrido de entrada (implementado)
La entrada es de Lliga Catalana: no muestra el nombre, el escudo ni los colores de ningún club hasta que se sabe a cuál pertenece el usuario.
1. **«¿Cómo quieres acceder?»**: gestor deportivo, capitán o jugador. Elegir no da permisos.
2. **Según el perfil**:
   - Gestor: «¿De qué club eres gestor deportivo?» con buscador del catálogo (escudo, nombre, localidad) y el último club usado arriba. Luego «Has seleccionado…» y acceso con Google. Si está autorizado (lista de gestores o `clubs/<club>/members/<uid>`), entra en el entorno de ese club. Si no, «Tu acceso como gestor está pendiente de validación», con solicitud al club o invitación de gestor.
   - Capitán: acceso con Google; se buscan los equipos en los que es capitán. Uno: entra en su gestión. Varios: elige equipo. Ninguno: se le explica y se le ofrecen sus otros perfiles.
   - Jugador: acceso con Google; se identifican sus equipos. Uno: entra. Varios: elige. Ninguno: código de invitación o solicitud de vinculación a un club, que el club resuelve eligiendo su ficha de jugador.
3. **Entrada al entorno**: se aplica la identidad del club y se reproduce la intro con su escudo.

Cada paso muestra en qué punto está y tiene «Atrás». Se recuerdan el último perfil y el último club en el dispositivo.

### Base ya publicada (antes de la v3)
1. **Cerrar sesión completo**: menú de cuenta en la cabecera (móvil y escritorio) y en Yo, con confirmación, estado de carga y errores. Cancela todas las escuchas, vacía los datos privados en memoria, borra la copia local de Firestore y vuelve a la pantalla de entrada sin dejar páginas privadas en el historial.
2. **Pantalla de acceso con tres roles** (gestor deportivo, capitán, jugador). Tras entrar con Google se comprueban los roles reales; si no tiene el elegido se explica por qué y qué puede hacer. Con varios roles se cambia de contexto desde el menú de cuenta, y el último se recuerda en ese dispositivo.
3. **Invitaciones para jugadores**: el capitán o la gestión genera un enlace por jugador y lo envía por WhatsApp. Elegir un nombre ya no basta: las reglas exigen la invitación. Los jugadores que ya están vinculados no se ven afectados.
4. **Flujo de gestor**: «¿De qué club formas parte?» con buscador sobre el catálogo, solicitud de vinculación y aprobación por un administrador, con registro de quién autorizó. Para el Polo, la aprobación lo añade a los gestores actuales.
5. **Catálogo de clubes**: importación CSV/XLSX para administradores, con vista previa antes de guardar.
6. **Identidad visual por club**: `club-config.js` y el documento del club aportan nombre, escudo, color principal y secundario, portada y contacto. La app aplica los colores sobre las variables del diseño base, sin permitir cambiar el resto de la interfaz.
7. **Rutas por club en el cliente**: todas las lecturas y escrituras pasan por una función que antepone la raíz de datos del club. Hoy esa raíz es vacía para el Polo, así que no cambia nada; en la fase 3 basta con apuntarla a `clubs/rcpb/`.

### Fase 0: seguridad (implementada)
- Solo con invitación por defecto (`meta/app.openClaims` ausente = cerrado). Jugadores y capitanes no ven ningún catálogo de clubes.
- Lectura por equipo: temporada y subcolecciones solo para sus jugadores (`memberIds`), sus capitanes y la gestión. Temporadas antiguas sin `memberIds`: cualquier jugador del club hasta que se guarden (o hasta «Preparar pertenencias»).
- Teléfonos: dueño, capitanes (`meta/app.captainPids`) y gestión. Fotos y lista pública: dueño, capitanes y gestión. Fichas vinculadas (`claims`): gestión, capitanes y la propia.
- Capitanes y `memberIds` solo los cambia la gestión (la plantilla con acceso, también el capitán de ese equipo).
- Desvincular una ficha corta el acceso: en la raíz, `users/<uid>` solo cuenta si `claims/<pid>` sigue siendo de esa cuenta.
- Servidor (`api/_auth.js`): mismas comprobaciones en notificaciones, recordatorios, sincronización FCT, lectura con IA e informes.

### Fase 1: usuarios, invitaciones y auditoría (implementada)
- Pertenencia en `clubs/<id>/members/<uid>`: `{ roles, pid, email, status }`. Se crea al aceptar la invitación (mismo lote, validado por las reglas) y con «Preparar pertenencias» para los ya vinculados.
- Invitaciones: un uso, caducidad, `revoked`, `email` opcional (solo esa cuenta), envío y reenvío por correo con la identidad del club (`api/send-invite.js`). Las de capitán solo las crea la gestión.
- Gestión deportiva → **Usuarios**: invitar, pendientes, reenviar, revocar, solicitudes, miembros (desactivar/reactivar, quitar de un equipo, desvincular) e historial.
- Historial `clubs/<id>/audit`: solo se añade (reglas sin update ni delete). Lo escriben la app y el servidor.

### Fase 2: datos por club, migración (herramienta lista; el cambio lo hace un administrador)
- La raíz de datos ya no es fija: `clubs/<id>.migrated = true` hace que la app (`B.setRoot`), el servidor (`dataRoot` en `api/_auth.js`) y las reglas (`dc()`) usen `clubs/<id>/…` a la vez. Las reglas de datos se escriben una vez y se aplican en la raíz y en `clubs/{club}/` (`scripts/build-rules.js`).
- `api/migrate.js` (solo administradores; también desde Configuración → Datos del club):
  1. **Comprobar**: recuentos por colección en la raíz y en la copia, temporadas sin `memberIds` y fichas sin pertenencia. No escribe.
  2. **Preparar pertenencias**: crea `members` con ficha, rellena `memberIds` y `captainPids`. Repetible.
  3. **Copiar**: raíz → `clubs/<id>/`, documentos y subcolecciones. Repetible; la raíz no se toca.
  4. **Verificar**: compara documento a documento (huella del contenido).
  5. **Pasar a la copia**: solo si la verificación sale exacta. Marca `migrated`.
  6. **Volver a la raíz** (rollback): copia a la raíz lo que haya cambiado en la copia y desmarca `migrated`.
- Orden recomendado: publicar las reglas → Preparar pertenencias → Copiar → Verificar → Pasar a la copia en un momento sin partidos. Los datos de la raíz se conservan hasta que se decida borrarlos.

### Fases 3 y 4: identidad y configuración inicial (implementadas)
- `clubs/<id>`: nombre oficial y corto, escudo (WebP/PNG y PNG para el PDF), portada, colores, contacto. Se aplican al validar la pertenencia: cabecera, intro, carteles, PDF (cliente y servidor), correos del informe y de invitación.
- Configuración inicial guardada en `clubs/<id>.setup` con nueve pasos que se marcan solos al ver los datos, «Marcar como hecho» y «Activar el club». Tarjeta con el siguiente paso en el Inicio hasta activarlo.

### Pendiente
- Varios clubes en el mismo despliegue: hoy cada despliegue fija `club-config.js` (id del club). Con los datos ya bajo `clubs/<id>/`, el siguiente paso es elegir el club a partir de la pertenencia del usuario en lugar del archivo, y que las tareas nocturnas recorran `clubs/*`.
- Fichero de reglas probado con el emulador de Firestore (no disponible en este entorno): ver la lista de comprobaciones del PR.

## 5. Pruebas
| Escenario | Fase |
| --- | --- |
| Cerrar sesión funciona y no se puede volver atrás a páginas privadas | 1 |
| Jugador entra y accede a su equipo | 1 |
| Capitán entra y puede gestionar su equipo | 1 |
| Usuario con varios roles cambia de contexto | 1 |
| Elegir un rol que no tiene no da acceso | 1 |
| Vincularse a un jugador sin invitación es rechazado por las reglas | 1 |
| El branding cambia según el club | 1 (configuración) y 2 (por club) |
| Gestor del Polo ve solo el Polo; gestor de otro club ve solo el suyo | 3 |
| No se accede a otro club cambiando URL o peticiones | 3 (reglas por club) |
