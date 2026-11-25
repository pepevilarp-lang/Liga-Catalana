window.POLO_CONFIG = {
  firebase: {
    apiKey: "AIzaSyBU1tL0LcevSyp-4WLlVF6swMP71vXzdV4",
    authDomain: "lliga-catalana-bf8e3.firebaseapp.com",
    projectId: "lliga-catalana-bf8e3",
    storageBucket: "lliga-catalana-bf8e3.firebasestorage.app",
    messagingSenderId: "807897020475",
    appId: "1:807897020475:web:0aff09bf7a8231c8b9c41e"
  },
  vapidKey: "BJFunnnF6YnNQTNv9fWNdy7sXGQf2h7uZOXVj1RCfeumNL_nT3sHIlOZrIBKcCrohHITLxVpGA_2qGrNYV3PVz4"
};

// Analítica de uso (PostHog, UE). Pega aquí la "Project API key" (empieza por phc_). Es pública: va en la app.
// Vacía = no se carga nada y no se pregunta a nadie.
window.DX_ANALYTICS = {
  key: "phc_q5zqwYMPsx6DcEMtTn5Cj8os7gfQEM7iGrYX7wGftAcL",
  host: "https://eu.i.posthog.com",
  app: "lliga",
  privacyUrl: "/privacidad.html",
  actionAttrs: ["data-act", "data-cx", "data-ax", "data-sx", "data-nav", "data-club"],
  // Nombre de pantalla sin ids: "jugador-pepe-vilar" -> "jugador", "jornada-10" -> "jornada"
  screenOf: h => h.replace(/^(jugador|informe|doc|club-doc|club-equipo|disponibilidad|encuesta|mvp|jornada|rival|scout|gestion-\w+)-.*$/, "$1")
};

// Avisos por WhatsApp (WhatsApp Business Platform). Ponlo a true cuando estén en Vercel WA_TOKEN, WA_PHONE_ID,
// WA_APP_SECRET y WA_VERIFY_TOKEN y Meta haya aprobado las plantillas (ver docs/WHATSAPP.md): entonces cada jugador
// verá en «Yo» la casilla para recibirlos.
window.LC_WHATSAPP = false;
