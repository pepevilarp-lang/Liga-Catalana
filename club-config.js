/* Identidad del club. Primer paso para usar la app en otros clubes de la Lliga Catalana:
   para otro club basta con cambiar este archivo (nombre, escudo, colores, equipos y grupos de la FCT).
   Lo usan la app (window.CLUB) y las funciones del servidor (require('../club-config.js')).
   Nota: el identificador interno del equipo del club en los calendarios sigue siendo 'polo' (POLO en app.js);
   cambiarlo exigiría migrar los datos guardados, así que se mantiene para todos los clubes. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); module.exports.forClub = forClub; }
  else { const base = factory(); root.CLUB_DEFAULT = base; root.CLUB = activeClub(base); }
  // En el navegador, el club activo lo decide la cuenta (access.js lo guarda en localStorage 'lc-club' con su
  // configuración en 'lc-club-cfg-<id>'). Sin club elegido, o si es el Real Club de Polo, se usa este archivo.
  function activeClub(base) {
    try {
      const id = localStorage.getItem('lc-club'); if (!id || id === base.id) return base;
      const cfg = JSON.parse(localStorage.getItem('lc-club-cfg-' + id) || 'null'); if (!cfg) return base;
      return forClub(id, cfg);
    } catch (e) { return base; }
  }
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

// Configuración de cualquier otro club a partir de su documento clubs/<id> (lo usan la app y el servidor).
// Sus datos viven en clubs/<id>/…; sus equipos, en su meta/app; su escudo, el que suba su gestión (o sus iniciales).
function forClub(id, d) {
  d = d || {};
  const name = String(d.name || 'Club').trim(), medium = String(d.shortName || d.medium || name).trim();
  const words = name.replace(/\b(club|de|del|la|les|el|i|tennis|tenis|esportiu|ct|c\.t\.)\b/gi, ' ').split(/[\s-]+/).filter(w => /^\p{L}/u.test(w));
  const abbr = (d.abbr || (words.length === 1 ? words[0].slice(0, 3) : words.map(w => w[0]).join('').slice(0, 3)) || 'CLB').toUpperCase();
  const colors = { primary: (d.colors && d.colors.primary) || '#0F3B2E', secondary: (d.colors && d.colors.secondary) || '#94722A' };
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><circle cx="48" cy="48" r="46" fill="' + colors.primary + '"/><circle cx="48" cy="48" r="40" fill="none" stroke="' + colors.secondary + '" stroke-width="3"/><text x="48" y="58" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="' + (abbr.length > 2 ? 26 : 32) + '" fill="#fff">' + abbr.replace(/[<&]/g, '') + '</text></svg>';
  const initials = 'data:image/svg+xml;base64,' + (typeof btoa === 'function' ? btoa(svg) : Buffer.from(svg).toString('base64'));
  const short = String(d.shortName || d.short || (words.length ? words.join(' ') : medium)).trim();
  return {
    id, fctId: String(d.fctId || ''), dataRoot: 'clubs/' + id,
    name, medium, short, teamShort: String(d.teamShort || short.split(' ').slice(-1)[0] || abbr), abbr,
    fileTag: String(d.fileTag || abbr).replace(/[^A-Za-z0-9]/g, '') || 'CLUB',
    fctMatch: String(d.fctMatch || words.slice().sort((a, b) => b.length - a.length)[0] || '').toLowerCase().replace(/[^\p{L}0-9-]/gu, '').trim(),   // palabra que identifica al club en los nombres de equipo de la FCT aliases: Array.isArray(d.aliases) ? d.aliases : [name, medium].filter(Boolean),
    town: String(d.town || ''), colors, crest: d.crest || initials, crestSm: d.crestSm || d.crest || initials,
    teams: [], fctGroups: d.fctGroups && typeof d.fctGroups === 'object' ? d.fctGroups : {}, generic: true,
  };
}
