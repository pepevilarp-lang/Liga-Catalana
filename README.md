# Polo A · Lliga Catalana

App privada del equipo masculino absoluto del Real Club de Polo de Barcelona.
GitHub + Vercel + Firebase. Instalable en el móvil y con notificaciones.

## Archivos (todo en la raíz del repositorio, respetando estas carpetas)
```
index.html  styles.css  app.js  sw.js  manifest.webmanifest
config.js        claves públicas de Firebase y clave web de notificaciones (vapidKey)
club-config.js   identidad del club: id, nombre, escudo, colores, equipos y grupos FCT (lo usan la app y el servidor)
access.js        entrada por rol, cierre de sesión, invitaciones, solicitud de gestor, catálogo de clubes e identidad visual
report-doc.js    composición del PDF «Weekend Sports Report» (app y servidor)
firestore.rules  reglas de seguridad de Firestore (se publican a mano, ver abajo)
vercel.json  package.json  README.md
icons/      icon-192.png  icon-512.png  maskable-512.png  apple-touch-icon.png  badge-96.png
img/        escudo.webp  escudo-sm.webp  ball.webp  court.jpg  felt.jpg  fuzz.webp  intro-*.jpg
api/        funciones de Vercel:
            notify.js        notificaciones push
            remind.js        recordatorios automáticos (tarea diaria)
            fct-sync.js      sincronización con la FCT (tarea nocturna) + avisos al gestor + informe automático
            auto-report.js   «Enviar ahora» del informe automático
            send-report.js   envío del resumen desde la app
            write-report.js  textos del informe con IA
            extract.js       lectura de documentos con IA
            _report.js _mail.js _ai.js _crest.js   (código compartido; no son direcciones públicas)
docs/       MULTICLUB.md     auditoría y plan por fases para varios clubes
```

## Datos en Firestore
- `meta/app`: temporada actual, equipos del club, gestores (`managers`, `managerEmails`), informe automático (`autoReport`) y avisos FCT (`fctAlerts`).
- `seasons/{temporada}` (Polo A) y `seasons/{temporada}-{equipo}`: calendario, plantilla, resultados, capitanes, `memberIds` y `fctLast`. Dentro: `avail`, `availNotes`, `picks`, `ballots`, `docs` (+`chunks`), `snapshots`, `mvp/{jornada}` (+`votes`).
- Del club: `claims`, `users`, `profiles`, `photos`, `phones` (teléfonos), `pushTokens`, `public/roster`, `reports` (registro de envíos), `invites` (invitaciones de jugador) y `admins`.
- De la plataforma: `catalog` (clubes de la FCT importados), `clubRequests` (solicitudes de gestores), `clubs/{id}` (identidad: colores y contacto) y `clubs/{id}/members` (gestores aprobados de otros clubes).

## Roles
La pantalla de entrada pregunta «¿Cómo accedes a la plataforma?» (gestor deportivo, capitán o jugador). Elegir no da permisos: la app comprueba los roles reales y, si no tiene el elegido, lo explica y ofrece los que sí tiene. Quien tiene varios roles cambia desde el menú de su avatar, que también tiene **Cerrar sesión**.
- **Jugador**: entra con el **enlace de invitación** que le envía su capitán o la gestión (Gestión → Plantilla → «Invitar», un solo uso, 30 días) y gestiona lo suyo desde **Yo**: foto, teléfono, ficha de tenista, disponibilidad y encuestas. Un administrador puede volver a permitir elegir el nombre sin invitación en Gestión deportiva → Configuración.
- **Capitán**: los marcados como capitán en la plantilla de su equipo. Piden disponibilidad, convocan, preparan el cartel, ponen resultados y publican el MVP. Ven los datos privados de su equipo.
- **Gestor del club**: se añade en Gestión deportiva → Configuración (nombre y Gmail), o lo pide él mismo al entrar como gestor («¿De qué club formas parte?») y un administrador aprueba la solicitud en Configuración; queda registrado quién la aprobó. Ve todos los equipos sin ser jugador: al entrar va directo a Gestión deportiva, sin elegir nombre ni hacer el tour de jugador.
- **Administrador**: además gestiona plantilla, capitanes y temporadas. Se da de alta en Firestore > colección `admins` > documento con su Gmail en minúsculas.

## Reglas de seguridad (cada vez que cambie `firestore.rules`)
Firebase > Firestore Database > **Reglas** > pegar el contenido de `firestore.rules` > **Publicar**. La consola guarda el historial: si algo dejara de funcionar, se puede volver a la versión anterior desde ahí.
Las reglas reflejan los roles de arriba. El MVP lo protege el servidor: un voto por jugador, nunca a uno mismo y sin poder cambiarlo; solo capitanes y gestión pueden anular un voto.

## Puesta en marcha de las notificaciones (una vez)
1. **Clave web**: Firebase > ⚙️ Configuración del proyecto > **Cloud Messaging** > *Certificados push web* > **Generar par de claves**. Copia la clave en `vapidKey` dentro de `config.js`.
2. **Cuenta de servicio**: Firebase > ⚙️ > **Cuentas de servicio** > **Generar nueva clave privada**. Se descarga un JSON. No lo subas a GitHub.
3. **Vercel**: Proyecto > **Settings > Environment Variables**. Nombre `FIREBASE_SERVICE_ACCOUNT`, valor: todo el contenido del JSON. Guarda y haz **Redeploy**.
4. Cada jugador pulsa **Activar** en **Yo**. En iPhone primero hay que instalar la app (Safari > Compartir > Añadir a pantalla de inicio) y activarlas desde la app instalada.

Avisos automáticos: al pedir disponibilidad (a todos), recordatorio (a quien falta), al publicar la convocatoria (a los convocados), al guardar el resultado (encuesta a los que jugaron) y al publicar el MVP (a todos). Si las notificaciones no están configuradas, la app sigue funcionando y los avisos se hacen por WhatsApp.

## Estadísticas
- **Individuales**: son la estadística principal de cada jugador (perfil, rankings, portada, comparativas, gráficos e índice). Win rate = victorias individuales / individuales jugados.
- **Dobles**: estadística independiente, con su ranking y el balance con cada pareja. Nunca alteran el porcentaje, la racha ni el ranking individual.
- Los rankings por porcentaje ordenan con un intervalo de confianza: con pocos partidos el porcentaje pesa menos, y siempre se muestra cuántos se han jugado.
- Si se corrige o se borra un resultado, todo se recalcula solo. La app valida los marcadores (sets de tenis válidos, ganador coherente, sin jugadores repetidos) y distingue entre resultado provisional y oficial.

## Cada jornada (Capitanes > Matchday)
1. Disponibilidad: mensaje de WhatsApp + notificación. Los jugadores responden con un toque hasta el plazo.
2. Convocatoria: 4 individuales y la pareja de dobles (solo juega si queda 2-2). Publicar avisa a los convocados.
3. Cartel: se compone solo con las fotos. Vertical, cuadrado u horizontal.
4. Resultados: al guardarlos se abre la encuesta para los que jugaron y se les avisa.
5. Encuesta: valoraciones y comentarios de los que jugaron. No incluye votaciones.
6. MVP: la única votación. Se abre sola al guardar el resultado (48 horas por defecto). Vota todo el equipo, un voto por jugador, nunca a uno mismo y sin poder cambiarlo; Firebase lo impide en el servidor. Los capitanes ven la participación y el recuento, pueden cambiar el plazo, cerrar, anular un voto por una incidencia y publicar. El MVP sale en la jornada con foto, votos, rival y fecha, y hay ranking de temporada en Estadísticas > MVP.

## Intro
Al abrir la app se reproduce una vez por sesión (unos 3,5 segundos, con «Saltar»): la pelota cae y bota sobre una pista en 3D, sale disparada hacia la cámara, el fieltro llena la pantalla, aparece el escudo y se abre hacia la app. Con «reducir movimiento» activado o en dispositivos muy limitados se muestra una transición corta con el escudo.

## Temporadas
En **Temporadas y ajustes** se crea la siguiente temporada sin perder las anteriores.


## Documentos y lectura con IA (Fases 2 y 3)
- Cada equipo tiene su repositorio de documentos por temporada y jornada (Gestión → Documentos). El gestor del club los ve todos en Gestión deportiva → Documentación.
- Los originales se guardan troceados en Firestore (sin servicio de almacenamiento de pago), hasta 15 MB por archivo, con historial de versiones.
- La IA solo propone: nada cambia en la app hasta que una persona revisa y pulsa «Validar y aplicar». Queda registrado quién validó y cuándo.
- Variables de entorno en Vercel:
  - `GROQ_API_KEY`: la clave de Groq (empieza por gsk_). Solo en Vercel, nunca en GitHub ni en el código.
  - `FIREBASE_PROJECT_ID`: `lliga-catalana-bf8e3`.
  - Opcionales: `GROQ_MODEL` (por defecto `qwen/qwen3.8-27b`), `AI_PROVIDER` (groq, openai, xai, gemini, anthropic) con su clave y modelo, `FIREBASE_SERVICE_ACCOUNT` (activa el tope diario `AI_DAILY_LIMIT`, por defecto 150 lecturas).

## Federació (FCT)
- Gestión deportiva → **Federació** (también la tarjeta destacada en Inicio): estado de cada equipo, última sincronización y botón «Sincronizar ahora».
- Cada noche (tarea de Vercel a las 21:30 UTC) se sincronizan todos los equipos: calendario, resultados, actas y plantillas.
- Lo que no cuadra (un resultado del Polo distinto en la FCT, una fecha cambiada a mano, jugadores de las actas que no están en la plantilla, o un fallo de sincronización) aparece en **Requiere atención** y se avisa por correo a los gestores (se puede desactivar en la pestaña Federació).
- Necesita en Vercel: `FIREBASE_SERVICE_ACCOUNT` y `CRON_SECRET`.

## Informe semanal automático
- Gestión deportiva → Configuración → **Informe semanal automático**. Activado por defecto: el domingo por la noche (o el lunes), después de sincronizar con la FCT, se envía a los gestores el mismo correo con el PDF que «Enviar desde la app». No se repite si ese fin de semana ya se envió automáticamente.
- «Enviar ahora» lo genera y lo envía al momento (sirve para probar).
- Necesita lo mismo que el envío desde la app (correo y, para los textos con IA, la clave de IA) más `FIREBASE_SERVICE_ACCOUNT` y `CRON_SECRET`. Opcional: `APP_URL` (dirección de la app para el enlace del correo).

## Envío del resumen por correo
- Gestión deportiva → Resumen del fin de semana → «Enviar por correo». Se elige a qué gestores se envía (o a uno mismo) y se puede añadir un mensaje.
- «Abrir en mi correo» funciona sin configurar nada: abre tu Mail o Gmail con todo escrito y lo envías tú.
- «Enviar desde la app» necesita en Vercel UNA de estas opciones:
  - Gmail del equipo: `SMTP_USER` (la dirección) y `SMTP_PASS` (contraseña de aplicación de Google, 16 letras). Requiere la verificación en dos pasos activada en esa cuenta.
  - Resend con dominio propio: `RESEND_API_KEY` y `MAIL_FROM`.
- Solo se puede enviar a gestores configurados en la app o a uno mismo. Cada envío queda registrado (fecha, destinatarios, estado) y nunca se da por enviado si el servicio no lo confirma.

## Gestió esportiva, capitanes y equipos (noviembre 2026)
- Gestió esportiva (icono del edificio): menú propio Inicio, Equipos, Federació, Documentación, Resumen y Configuración.
- Documentació: se elige el equipo en el desplegable y desde ahí se sube, se lee con IA, se revisa y se valida. El tipo de un documento se cambia desde la propia fila, sin borrarlo; queda registrado quién y cuándo, y no se vuelve a leer solo.
- Equips: vista de tarjetas o de tabla (se recuerda la última), con ordenación y filtros por categoría y género.
- Capitanes y administradores ven en Inicio el siguiente paso real de la jornada, con botón directo, y un punto rojo en «Gestió» cuando hay algo pendiente.
- Permisos por equipo: cada temporada de equipo guarda la lista de sus jugadores (memberIds). Un jugador solo puede editar su equipo; los gestores del club y los administradores, todos.
- Equipo Absoluto Femenino A creado sin datos: se cargan su calendario y plantilla desde Documentació.

## Informe PDF adjunto al resumen semanal
- Gestión deportiva → Resumen → «Enviar por correo» → «Enviar desde la app»: genera automáticamente el informe «Weekend Sports Report» (A4, portada, resumen ejecutivo, resultados por equipo, informe del capitán, análisis y mejoras, próximas jornadas) y lo adjunta al correo de siempre como `Weekend_Sports_Report_RCPB_[FECHA].pdf`.
- Si el PDF no se puede generar, no se envía el correo y se muestra el error para reintentar.
- Las conclusiones y recomendaciones las redacta la IA (función `api/write-report.js`, mismas variables que la lectura de documentos) solo con datos registrados; si la IA no responde, el informe se genera igual con textos sacados directamente de los datos.
- El informe del capitán se rellena en Matchday → Postpartido. Si no está, el PDF lo indica.

## Otro club (multi-club)
Plan completo y estado por fases: `docs/MULTICLUB.md`. Los colores del club se cambian en Gestión deportiva → Configuración → Identidad del club (solo administradores), y el catálogo de clubes de la FCT se importa ahí mismo desde un CSV o Excel.

La identidad del club está en `club-config.js`: nombre, nombre corto, escudo, equipos, grupos FCT y cómo aparece el club en actas y en la FCT. Para otro club se cambia ese archivo y el escudo de `img/` (y, para el PDF del servidor, `api/_crest.js`, que es el escudo en PNG). Firebase y Vercel son por club: cada club tiene su propio proyecto.
