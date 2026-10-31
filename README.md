# Polo A · Lliga Catalana

App privada del equipo masculino absoluto del Real Club de Polo de Barcelona.
GitHub + Vercel + Firebase. Instalable en el móvil y con notificaciones.

## Archivos (todo en la raíz del repositorio, respetando estas carpetas)
```
index.html  styles.css  app.js  config.js  sw.js  manifest.webmanifest
vercel.json  package.json  firestore.rules  README.md
icons/      icon-192.png  icon-512.png  maskable-512.png  apple-touch-icon.png  badge-96.png
img/        escudo.webp  escudo-sm.webp  ball.webp  intro-photo.jpg  intro-bg-blur.jpg   (escudo y pelota de la intro)
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

## Cada jornada (Capitanes > Centro de jornada)
1. Disponibilidad: mensaje de WhatsApp + notificación. Los jugadores responden con un toque hasta el plazo.
2. Convocatoria: 4 individuales y la pareja de dobles (solo juega si queda 2-2). Publicar avisa a los convocados.
3. Cartel: se compone solo con las fotos. Vertical, cuadrado u horizontal.
4. Resultados: al guardarlos se abre la encuesta para los que jugaron y se les avisa.
5. Encuesta: valoraciones y comentarios de los que jugaron. No incluye votaciones.
6. MVP: la única votación. Se abre sola al guardar el resultado (48 horas por defecto). Vota todo el equipo, un voto por jugador, nunca a uno mismo y sin poder cambiarlo; Firebase lo impide en el servidor. Los capitanes ven la participación y el recuento, pueden cambiar el plazo, cerrar, anular un voto por una incidencia y publicar. El MVP sale en la jornada con foto, votos, rival y fecha, y hay ranking de temporada en Estadísticas > MVP.

## Intro
Al abrir la app se reproduce una vez por sesión (unos 3,5 segundos, con «Saltar»). Con «reducir movimiento» activado o en dispositivos muy limitados se muestra una transición corta con el escudo.

## Temporadas
En **Temporadas y ajustes** se crea la siguiente temporada sin perder las anteriores.
