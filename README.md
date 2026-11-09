# Polo A · Lliga Catalana

App privada del equipo masculino absoluto del Real Club de Polo de Barcelona.
GitHub + Vercel + Firebase. Instalable en el móvil y con notificaciones.

## Archivos (todo en la raíz del repositorio, respetando estas carpetas)
```
index.html  styles.css  app.js  config.js  sw.js  manifest.webmanifest
vercel.json  package.json  firestore.rules  README.md
icons/      icon-192.png  icon-512.png  maskable-512.png  apple-touch-icon.png  badge-96.png
img/        escudo.webp  escudo-sm.webp  ball.webp  court.jpg  felt.jpg  fuzz.webp   (escudo, pelota y texturas de la intro)
api/        notify.js      (función de Vercel que envía las notificaciones)
```

## Roles
- **Jugador**: entra con Google, elige su nombre y gestiona lo suyo desde **Yo**: foto, teléfono, ficha de tenista, disponibilidad y encuestas.
- **Capitán**: los marcados como capitán en la plantilla. Piden disponibilidad, convocan, preparan el cartel, ponen resultados y publican el MVP.
- **Administrador**: además gestiona plantilla, capitanes y temporadas. Se da de alta en Firestore > colección `admins` > documento con su Gmail en minúsculas.

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

## Envío del resumen por correo
- Gestión deportiva → Resumen del fin de semana → «Enviar por correo». Se elige a qué gestores se envía (o a uno mismo) y se puede añadir un mensaje.
- «Abrir en mi correo» funciona sin configurar nada: abre tu Mail o Gmail con todo escrito y lo envías tú.
- «Enviar desde la app» necesita en Vercel UNA de estas opciones:
  - Gmail del equipo: `SMTP_USER` (la dirección) y `SMTP_PASS` (contraseña de aplicación de Google, 16 letras). Requiere la verificación en dos pasos activada en esa cuenta.
  - Resend con dominio propio: `RESEND_API_KEY` y `MAIL_FROM`.
- Solo se puede enviar a gestores configurados en la app o a uno mismo. Cada envío queda registrado (fecha, destinatarios, estado) y nunca se da por enviado si el servicio no lo confirma.

## Gestió esportiva, capitanes y equipos (noviembre 2026)
- Gestió esportiva (icono del edificio): menú propio Inici, Equips, Documentació, Resum y Configuració.
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

## Mi presentación: vídeo de salida a pista con IA (Higgsfield)
- En **Yo → Mi ficha** y en el propio perfil, cada jugador puede crear un vídeo vertical de unos 5 segundos entrando en pista, a partir de una foto suya. Es opcional: no se genera nada hasta que elige la foto, marca el consentimiento y pulsa «Generar mi vídeo».
- Flujo: foto → recorte 9:16 → consentimiento → `api/presentation.js` sube la foto a Higgsfield y crea el trabajo → estados *pendiente*, *generando*, *completado* o *error* → el vídeo se guarda en Firestore (colección `presentations`, troceado) y aparece en el perfil. Mientras tanto la app sigue funcionando y consulta el estado cada 10 segundos.
- El vídeo lo ve el equipo en el perfil del jugador. El jugador puede compartirlo, descargarlo, volver a generarlo o eliminarlo. Un administrador puede eliminar cualquiera. La foto de perfil no cambia.
- Privacidad: cuando el vídeo queda guardado en el club, se borran en Higgsfield la foto, el prompt y el vídeo (`DELETE /requests/{id}`). Se guarda quién dio el consentimiento y cuándo.
- Coste: máximo `PRESENTATION_MONTHLY_LIMIT` vídeos por jugador y mes (por defecto 2) y `PRESENTATION_GLOBAL_MONTHLY_LIMIT` para todo el club (por defecto 25). Un solo vídeo en curso por jugador. Si Higgsfield rechaza el trabajo, no cuenta.
- La colección `presentations` no necesita reglas nuevas: solo la escribe y la lee el servidor.
- Variables de entorno en Vercel:
  - `HF_API_KEY_ID` y `HF_API_KEY_SECRET`: la clave de la API de Higgsfield (console.higgsfield.ai → API keys). Solo en Vercel, nunca en GitHub.
  - `FIREBASE_SERVICE_ACCOUNT`: la misma de las notificaciones.
  - Opcional `HF_WEBHOOK_SECRET` (Higgsfield Console → Settings, empieza por `whsec_`): Higgsfield avisa a `/api/presentation?hook=1` al terminar y el vídeo se guarda aunque el jugador haya cerrado la app.
  - Opcional `HF_VIDEO_ENDPOINT`: modelo de vídeo. Por defecto `/kling-video/v2.5-turbo/pro/image-to-video` (Kling 2.5 Turbo Pro). También admite `/minimax/hailuo-2.3/standard/image-to-video`.
- El modelo es de imagen a vídeo: el clip arranca desde la foto. Sale mejor con fotos de cuerpo entero o medio cuerpo, de pie, con buena luz y la cara visible.
