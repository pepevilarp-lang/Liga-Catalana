# Polo A · Lliga Catalana 2026-27

App privada del equipo masculino absoluto del Real Club de Polo de Barcelona.
Mismo stack que la Americana: GitHub + Vercel + Firebase (Google y Firestore).

## Archivos
```
index.html        estructura
styles.css        diseño y animaciones
app.js            lógica, datos oficiales y pantallas
config.js         configuración de Firebase (la rellenas tú)
firestore.rules   reglas de seguridad
vercel.json       cabeceras (noindex, ventana de Google)
```
Las fotos ya no van en carpetas: se suben y recortan desde **Administración > Plantilla y fotos** y se guardan en Firestore (no hace falta Firebase Storage ni el plan de pago).
Si `config.js` está vacío, la app funciona en **modo vista previa**: entra sin Google y guarda los datos solo en ese navegador. Sirve para probarla.

## 1. Firebase (unos 10 minutos)
1. https://console.firebase.google.com > **Añadir proyecto** (por ejemplo, `polo-lliga`). Analytics no hace falta.
2. **Authentication > Comenzar > Google > Habilitar**. Elige tu correo de asistencia y guarda.
3. **Authentication > Configuración > Dominios autorizados > Añadir dominio**: el dominio que te dé Vercel (por ejemplo `polo-lliga.vercel.app`).
4. **Firestore Database > Crear base de datos**, ubicación `europe-west` y modo producción.
5. **Firestore > Reglas**: pega todo `firestore.rules` y **Publicar**.
6. **Configuración del proyecto > Tus apps > Web (</>)**: registra la app y copia el objeto `firebaseConfig` dentro de `config.js`.

## 2. Administradores
En **Firestore > Iniciar colección** crea la colección `admins` y dentro un documento cuyo **ID sea tu Gmail en minúsculas** (por ejemplo `pepevilarp@gmail.com`). Sin campos, o con uno cualquiera. Repite con el capitán.
Los administradores ven el icono de ajustes arriba a la derecha.

## 3. GitHub y Vercel
1. Sube todos los archivos a un repositorio nuevo, respetando las carpetas.
2. En Vercel: **Add New > Project**, importa el repositorio y **Deploy** (sin build, es estático).
3. Comprueba que el dominio de Vercel está en los dominios autorizados de Firebase (paso 1.3).

## 4. Primer uso
1. Entra con tu Gmail y elige tu nombre.
2. En **Administración > Ajustes** pulsa **Guardar** una vez: crea la temporada en la base de datos.
3. Pasa el enlace al grupo. Cada uno entra con Google y elige su nombre una sola vez. Queda ligado a su Gmail en cualquier dispositivo; nadie puede quedarse el de otro.

## Cómo funciona cada jornada (Administración > Centro de jornada)
1. **Disponibilidad**: pulsa «Solicitar disponibilidad». Se genera el mensaje con rival, fecha, hora, plazo y enlace; lo editas y se abre WhatsApp. WhatsApp no deja elegir un grupo desde un enlace: al abrirse eliges el grupo del equipo. También puedes copiarlo o compartirlo.
2. **Respuestas**: cada jugador abre el enlace, entra con Google y marca Disponible, No disponible o Pendiente de confirmar, con comentario opcional. Puede cambiarla hasta el plazo (por defecto 2 días antes a las 21:00, editable por jornada).
3. **Panel**: disponibles, pendientes, no disponibles y sin respuesta, % de disponibilidad, comentarios, hora de cada respuesta, cuántas veces ha cambiado y evolución. Recordatorio al grupo con la lista de quién falta, o individual a quien tenga teléfono guardado. Si alguien te contesta por otro lado, lo anotas a mano.
4. **Convocatoria**: eliges convocados, los 4 individuales y la pareja de dobles; el resto quedan como suplentes. Se guarda como borrador hasta que pulsas «Publicar».
5. **Cartel**: se compone solo con las fotos y se adapta al número de convocados. Formatos vertical (stories), cuadrado y horizontal; fondo de pista o foto del equipo; títulos, orden y jugadores editables. Se descarga en PNG o se comparte desde el móvil.
6. **Resultados**: 4 individuales y, si queda 2-2, el dobles. Las estadísticas se actualizan solas.
7. **Encuesta y MVP**: se abre sola para los que jugaron; luego publicas premios.

Todo queda en la temporada: la disponibilidad guarda la respuesta final de cada jornada y todos los cambios anteriores. «Sin respuesta» se cuenta aparte de «No disponible», y la disponibilidad declarada se compara con las convocatorias en **Estadísticas > Disponibilidad**.

## Temporadas
En **Temporadas y ajustes** creas la siguiente temporada (copia plantilla y clubes, calendario vacío) sin tocar las anteriores, y puedes volver a ver o editar cualquiera.

Los rivales se nombran siempre por su club.
