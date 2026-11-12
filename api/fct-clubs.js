// Catálogo de clubes de la Federació Catalana de Tennis para el buscador de la pantalla de entrada.
// Fuente: el portal oficial de la FCT (portal.fctennis.cat, api/club.do, acción «buscar»), el mismo que usa
// el buscador de clubes del portal. Son datos públicos: no hace falta iniciar sesión.
// La FCT no publica escudos (el campo «logo» viene vacío); la app usa el escudo configurado del club,
// el que suba el propio club o el icono de su web oficial (la que figura en la FCT).
const FCT_CLUBS = 'https://portal.fctennis.cat/app/api/club.do';
const PARTICLES = new Set(['de', 'del', 'la', 'les', 'el', 'els', 'i', 'y', 'a', 'en']);
const KEEP_UPPER = new Set(['CT', 'CE', 'CN', 'RC', 'RCT', 'RST', 'TC', 'CD', 'CDT', 'CNT', 'CET', 'FC', 'CF', 'AE', 'CEM', 'II', 'XXI']);

function title(s) {
  const str = String(s || '').replace(/\s+/g, ' ').trim();
  const shouting = str === str.toUpperCase();
  return str.split(' ').map((w, i) => {
    if (KEEP_UPPER.has(w.replace(/[.,]/g, '').toUpperCase()) && (shouting || w === w.toUpperCase())) return w.toUpperCase();
    const lw = w.toLowerCase();
    if (i && PARTICLES.has(lw)) return lw;
    if (i && /^(d|l)'/.test(lw)) return lw.slice(0, 2) + lw.charAt(2).toUpperCase() + lw.slice(3);
    return lw.replace(/(^|[-'(·"])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  }).join(' ');
}
// «Hospitalet De Llobregat,l'» → «L'Hospitalet de Llobregat»; «Masnou, El» → «El Masnou»
function town(s) {
  const m = /^(.*?),\s*(l'|la|les|el|els)\s*$/i.exec(String(s || '').trim());
  const t = m ? (m[2].toLowerCase() === "l'" ? "L'" + m[1].trim() : m[2] + ' ' + m[1].trim()) : s;
  return title(t);
}
function domain(web) {
  const w = String(web || '').trim().toLowerCase().split(/\s+/)[0].replace(/^https?:\/\//, '').replace(/^w+\.(?=[^.]+\.)/, 'www.');
  const host = w.split('/')[0].replace(/\.$/, '').replace(/^www\./, '');
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : '';
}
// Fuera del buscador: cuentas de la federación, escuelas y clubes dados de baja
const NOT_A_CLUB = /^(independents?|indep\.|escola|esc\.|altre territorial|federaci[oó]|ute |up sport escola)|\(baixa\)|-baixa-|\bbaixa\b|^\.$/i;

async function fetchAll() {
  const out = []; let start = 1;
  for (let i = 0; i < 20; i++) {
    const r = await fetch(FCT_CLUBS, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ accion: 'buscar', start, count: 100, data: { nombre: '' } }) });
    if (!r.ok) throw new Error('FCT respondió ' + r.status);
    const j = await r.json();
    if (j.error) throw new Error('FCT: error al listar los clubes');
    const page = Array.isArray(j.data) ? j.data : [];
    out.push(...page);
    if (!page.length || out.length >= (j.registros || 0)) break;
    start += page.length;
  }
  return out;
}

module.exports = async (req, res) => {
  try {
    const raw = await fetchAll();
    const seen = new Set();
    const clubs = raw.filter(c => c && c.idClub && !NOT_A_CLUB.test(String(c.nombre || '').trim()) && !/000$/.test(c.idClub))
      .filter(c => !seen.has(c.idClub) && seen.add(c.idClub))
      .map(c => ({ id: String(c.idClub), name: title(c.nombre), short: String(c.nombreCorto || '').trim(), town: town(c.poblacion), province: title(c.provincia), web: domain(c.web), logo: c.logo ? String(c.logo) : '' }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ca'));
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ source: 'Federació Catalana de Tennis (portal.fctennis.cat)', at: Date.now(), clubs });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: e.message || 'error', clubs: [] });
  }
};
module.exports._test = { title, town, domain, NOT_A_CLUB };
