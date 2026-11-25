# WhatsApp y automatización del capitán

Estado: noviembre de 2026. Primera versión en producción: centro de automatización del capitán, recordatorios por persona, avisos por notificación y correo, y mensajes preparados para el grupo de WhatsApp.

## Qué permite WhatsApp de verdad

**No existe ninguna forma oficial de conectar una app a un grupo de WhatsApp que ya existe** (el grupo que el equipo usa hoy): ni para leerlo ni para escribir en él. Las alternativas que lo hacen (WhatsApp Web automatizado, librerías no oficiales) incumplen las condiciones de Meta y acaban en bloqueo del número. No se usan.

Lo que sí existe:

| | Qué es | Sirve para Lliga Catalana |
|---|---|---|
| **A. Enlaces** (`wa.me`, `chat.whatsapp.com`) | Abren WhatsApp con un texto ya escrito, o abren un grupo | Sí, hoy, sin coste. El capitán pulsa enviar |
| **B. WhatsApp Business Platform (Cloud API)** | Un número de empresa envía mensajes 1 a 1 con plantillas aprobadas por Meta y recibe respuestas por webhook | Sí, como fase 2: recordatorios individuales automáticos con botones «Puedo / No puedo» |
| **C. Groups API (Cloud API)** | Grupos creados **por** la empresa, por invitación | No encaja: solo para cuentas oficiales (OBA), máximo 8 participantes, sin mensajes interactivos y no sirve para el grupo existente |

### Condiciones de la Business Platform (fase 2)

- **Cuenta**: Meta Business verificado (datos de la empresa), una cuenta de WhatsApp Business (WABA) y un número dedicado que no se use en la app de WhatsApp. Un número para toda la plataforma, con el nombre visible «Lliga Catalana».
- **Consentimiento**: cada jugador debe aceptar recibir mensajes por WhatsApp (opt-in explícito y revocable). Se pediría en «Yo», junto al teléfono, que ya existe.
- **Plantillas**: fuera de la ventana de 24 h solo se pueden enviar plantillas aprobadas por Meta. Las nuestras son de categoría «utilidad» (disponibilidad, convocatoria, cambio de horario, resultado).
- **Ventana de atención**: cuando el jugador responde, durante 24 h se le puede escribir libremente y gratis.
- **Precio**: por mensaje desde el 1 de julio de 2025. En España, una plantilla de utilidad cuesta en torno a 0,02 € (tarifa de Meta, sin IVA ni margen del proveedor); los mensajes de servicio y las plantillas de utilidad dentro de la ventana de 24 h son gratis. Orden de magnitud: un equipo de 12 con 3 recordatorios por jornada y 14 jornadas son menos de 15 € por temporada.
- **Webhooks**: las respuestas («Puedo», «No puedo») llegan a un endpoint del servidor, que las guarda como disponibilidad del jugador. Hay que verificar la firma `X-Hub-Signature-256` y responder rápido; los reintentos de Meta obligan a que el guardado sea idempotente (id del mensaje).
- **Límites**: el número empieza con un límite diario de conversaciones que sube con la calidad; con un solo número da para muchos clubes.

## Qué hace ya la app (fase 1, en producción)

1. **Solicitar disponibilidad**: el capitán pulsa el botón y la app registra la solicitud, avisa a todo el equipo (notificación de la app y, a quien no la tiene activada, correo) y deja preparado el mensaje para el grupo con el enlace directo a la jornada (`#disponibilidad-N`). También puede pedirla solo por la app.
2. **Recordatorios por persona** (`api/remind.js`, dos veces al día): primer recordatorio a las X horas sin responder, después cada N días, un último aviso antes del cierre y nunca más de M por persona. Quien responde deja de recibirlos; al cerrar la disponibilidad se paran todos.
3. **Cambios de fecha u hora**: si una jornada con disponibilidad pedida o convocatoria publicada cambia de fecha u hora, la app avisa a los afectados.
4. **Convocatoria**: aviso a los convocados al publicarla, mensaje y cartel para el grupo y, si cambia después de anunciarla, aviso al capitán para compartir la versión actualizada.
5. **Día antes**: recordatorio a los convocados entre 36 y 6 horas antes.
6. **Después del partido**: si a las 3 horas no hay resultado, se pide al capitán, con enlace directo a «Resultados» (`#gestion-res-N`).
7. **Grupo de WhatsApp**: el capitán guarda el enlace de invitación; desde cualquier mensaje, «Copiar y abrir el grupo» copia el texto y abre el grupo. La app no lee ni escribe en él.
8. **Centro de automatización**: en Gestión → Jornada, qué está haciendo la app, cuándo será el próximo envío, historial, pausa, «Ejecutar ahora» y ajustes.
9. **Supervisión del gestor**: en Equipos del club, si cada equipo tiene los avisos activos y el grupo vinculado. No ve conversaciones: no existen en la app.

## Arquitectura

```
Capitán ── decide (quién juega, parejas, alineación)
   │
   ▼
Temporada (Firestore)  S.auto (ajustes) · S.wa (grupo) · S.autoLog (lo enviado, lo escribe el servidor)
   │
   ▼
api/remind.js  (Vercel Cron 08:00 y 16:00 UTC)  ── decide a quién toca y qué
api/notify.js  (acciones del capitán)
   │
   ▼
api/_deliver.js  ── un único punto de entrega por canales
   ├─ notificación push (Firebase Cloud Messaging)
   ├─ correo de respaldo (SMTP / Resend)
   └─ [fase 2] WhatsApp Cloud API: plantilla de utilidad 1 a 1, solo con opt-in
```

- Las credenciales (cuenta de servicio, SMTP, y en el futuro el token de WhatsApp) están solo en variables de entorno de Vercel. Nunca en el navegador ni en GitHub.
- Cada club y equipo tiene su configuración en su propia temporada; el servidor resuelve la ruta de datos del club (`api/_auth.js`).
- El registro por persona (cuántos recordatorios lleva cada uno) está en `remLog/<temporada>`, que solo lee el servidor.

### Fase 2: hecha en el código, pendiente de activar

El código ya está (diciembre de 2026). No envía nada hasta que se configure:

- `api/_wa.js`: envío de plantillas, firma de los botones y de Meta.
- `api/_deliver.js`: canal WhatsApp después de la notificación y antes del correo, solo a quien tiene `phones/<pid>.wa = true`.
- `api/wa-webhook.js`: recibe «Puedo / No puedo», comprueba la firma de Meta, la del botón y que el número sea el del jugador, guarda la disponibilidad (idempotente) y le confirma por WhatsApp.
- «Yo» → Tu teléfono: casilla «Recibir los avisos por WhatsApp» (visible cuando `window.LC_WHATSAPP = true` en `config.js`).

**Pasos para activarlo (los hace Dossau, con sus datos):**

1. **Meta Business**: crear o verificar la empresa en business.facebook.com (datos de Dossau).
2. **App de Meta** en developers.facebook.com con el producto WhatsApp; añadir un **número dedicado** (que no se use en la app de WhatsApp) con el nombre visible «Lliga Catalana».
3. **Token permanente**: un usuario del sistema con permiso `whatsapp_business_messaging` → `WA_TOKEN`. El identificador del número → `WA_PHONE_ID`. El secreto de la app → `WA_APP_SECRET`. Un texto inventado → `WA_VERIFY_TOKEN`.
4. **Variables en Vercel** (proyecto lliga, Production): `WA_TOKEN`, `WA_PHONE_ID`, `WA_APP_SECRET`, `WA_VERIFY_TOKEN` (opcionales: `WA_LANG`, `WA_TPL_AVISO`, `WA_TPL_DISPO`). Volver a publicar.
5. **Webhook** en la app de Meta: URL `https://lliga.vercel.app/api/wa-webhook`, token de verificación = `WA_VERIFY_TOKEN`; suscribirse al campo `messages`.
6. **Plantillas** (categoría «Utilidad», idioma español):

   **`aviso_equipo`**
   - Cuerpo: `{{1}}` + salto de línea + `{{2}}`
     (ejemplo: «Cambio de horario: jornada 5» / «Polo contra Vall Parc pasa al sábado 12 a las 15:00.»)
   - Botón de URL: «Abrir en la app», URL dinámica `https://lliga.vercel.app/{{1}}` (ejemplo: `#jornada-5`).

   **`disponibilidad`**
   - Cuerpo: `{{1}}: {{2}}` (ejemplo: «Polo A: ¿Puedes jugar contra Vall Parc el sábado 12 de diciembre a las 9:00 (en casa)?»)
   - Dos botones de respuesta rápida: «Puedo» y «No puedo».

7. Cuando Meta apruebe las plantillas: `window.LC_WHATSAPP = true` en `config.js` y publicar. Probar con un móvil propio: aceptar en «Yo», pedir la disponibilidad desde Gestión y pulsar «Puedo».

**Coste orientativo**: plantillas de utilidad en España, unos 0,02 € por mensaje fuera de la ventana de 24 h; las confirmaciones tras la respuesta del jugador son gratis.

## Fuentes

- Meta, Groups API: https://developers.facebook.com/documentation/business-messaging/whatsapp/groups/
- Meta, precios de WhatsApp Business Platform: https://developers.facebook.com/docs/whatsapp/pricing
- Tarifa de referencia para España (a partir del 1 de octubre de 2026, tarifa de Meta más margen del proveedor): https://www.go4whatsup.com/spain/whatsapp-business-api-pricing/
