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

## Cada jornada (Gestión > Jornada)
1. Disponibilidad: mensaje de WhatsApp + notificación. Los jugadores responden con un toque hasta el plazo.
2. Convocatoria: 4 individuales y la pareja de dobles (solo juega si queda 2-2). Publicar avisa a los convocados.
3. Cartel: se compone solo con las fotos. Vertical, cuadrado u horizontal.
4. Resultados: al guardarlos se abre la encuesta para los que jugaron y se les avisa.
5. Encuesta: valoraciones y comentarios de los que jugaron. No incluye votaciones.
6. MVP: la única votación. Se abre sola al guardar el resultado (48 horas por defecto). Vota todo el equipo, un voto por jugador, nunca a uno mismo y sin poder cambiarlo; Firebase lo impide en el servidor. Los capitanes ven la participación y el recuento, pueden cambiar el plazo, cerrar, anular un voto por una incidencia y publicar. El MVP sale en la jornada con foto, votos, rival y fecha, y hay ranking de temporada en Estadísticas > MVP.

## Intro
Al abrir la app se reproduce una vez por sesión (unos 3,5 segundos, con «Saltar»): la pelota cae y bota sobre una pista en 3D, sale disparada hacia la cámara, el fieltro llena la pantalla, aparece el escudo y se abre hacia la app. Con «reducir movimiento» activado o en dispositivos muy limitados se muestra una transición corta con el escudo.

## Temporadas
En **Gestión > Ajustes > Temporadas** se crea la siguiente temporada sin perder las anteriores.
