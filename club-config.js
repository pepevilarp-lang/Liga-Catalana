/* Identidad del club. Primer paso para usar la app en otros clubes de la Lliga Catalana:
   para otro club basta con cambiar este archivo (nombre, escudo, colores, equipos y grupos de la FCT).
   Lo usan la app (window.CLUB) y las funciones del servidor (require('../club-config.js')).
   Nota: el identificador interno del equipo del club en los calendarios sigue siendo 'polo' (POLO en app.js);
   cambiarlo exigiría migrar los datos guardados, así que se mantiene para todos los clubes. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CLUB = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    id: 'rcpb',                               // identificador del club en la plataforma (clubs/<id>, invitaciones, solicitudes)
    fctId: '0708017',                         // código del club en la FCT (portal.fctennis.cat): lo enlaza con su ficha del buscador
    dataRoot: '',                             // raíz de sus datos en Firestore: '' = la raíz actual; en la fase 3 del plan, 'clubs/rcpb'
    name: 'Real Club de Polo de Barcelona',   // nombre completo (cabeceras, informe, correos)
    medium: 'Real Club de Polo',              // nombre de uso habitual
    short: 'RC de Polo',                      // como aparece en la clasificación
    teamShort: 'Polo',
    abbr: 'RCP',
    fileTag: 'RCPB',                          // en el nombre del PDF: Weekend_Sports_Report_RCPB_2026-11-08.pdf
    fctMatch: 'polo',                         // palabra que identifica al club en los nombres de equipo de la FCT («Polo, RC de - B»)
    aliases: ['Polo, RC de', 'RC Polo', 'R.C. Polo', 'Real Club de Polo', 'Reial Club de Polo'],   // cómo aparece en actas y documentos
    town: 'Barcelona',
    colors: { primary: '#0F3B2E', secondary: '#94722A' },   // colores de marca; se pueden cambiar desde Configuración (clubs/<id>)
    crest: 'img/escudo.webp',
    crestSm: 'img/escudo-sm.webp',
    // Equipos del club. El primero conserva la ruta original de su temporada (seasons/2026-27); el resto: seasons/<temporada>-<equipo>
    teams: [
      { id: 'polo-a', name: 'Absoluto Masculino A', short: 'Polo A', cat: 'Absoluto', gender: 'Masculino' },
      { id: 'polo-b', name: 'Absoluto Masculino B', short: 'Polo B', cat: 'Absoluto', gender: 'Masculino' },
      { id: 'fem-a', name: 'Absoluto Femenino A', short: 'Femenino A', cat: 'Absoluto', gender: 'Femenino' },
    ],
    // Grupos de la FCT por temporada de equipo (13a Lliga Catalana 2026-27, torneo 4296). También se pueden poner desde la app.
    fctGroups: { '2026-27': 4622, '2026-27-polo-a': 4622, '2026-27-polo-b': 4621, '2026-27-fem-a': 4599 },
  };
});
