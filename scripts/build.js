// Compilación de la web para Vercel (vercel.json → buildCommand; sale en dist/):
//  1. app.js se monta juntando src/app/*.js en orden (el código de la app, partido por secciones para trabajar mejor).
//  2. Cada JS y CSS de la web se minimiza con esbuild, archivo por archivo y sin cambiar los nombres globales
//     (los scripts se comparten variables y funciones entre sí, como hasta ahora).
//  3. La versión de la caché del service worker (sw.js) es una huella del contenido: cambia sola con cada cambio.
//  4. errors.js lleva la versión, para saber en qué versión ha pasado cada error.
// Uso: node scripts/build.js   (y para probar en local: servir la carpeta dist/)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'dist');
const SKIP = new Set(['api', 'scripts', 'docs', 'src', 'dist', 'node_modules', '.git', '.github', '.vercel', 'package.json', 'package-lock.json', 'vercel.json', 'firestore.rules', 'README.md', '.gitignore', '.vercelignore']);
let esbuild = null; try { esbuild = require('esbuild'); } catch (e) { console.warn('[build] esbuild no está instalado: se copian los archivos sin minimizar'); }

fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
// Archivos estáticos tal cual
(function copy(dir, rel) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!rel && (SKIP.has(f.name) || f.name.startsWith('.'))) continue;
    const s = path.join(dir, f.name), d = path.join(OUT, rel, f.name);
    if (f.isDirectory()) { fs.mkdirSync(d, { recursive: true }); copy(s, path.join(rel, f.name)); } else fs.copyFileSync(s, d);
  }
})(ROOT, '');
// 1. app.js
const parts = fs.readdirSync(path.join(ROOT, 'src/app')).filter(f => f.endsWith('.js')).sort();
fs.writeFileSync(path.join(OUT, 'app.js'), parts.map(f => fs.readFileSync(path.join(ROOT, 'src/app', f), 'utf8')).join(''));
// Huella de la versión: todo lo que va a la caché del navegador
const hash = crypto.createHash('sha256');
for (const f of fs.readdirSync(OUT).filter(f => /\.(js|css|html|webmanifest)$/.test(f) && f !== 'sw.js').sort()) hash.update(f).update(fs.readFileSync(path.join(OUT, f)));
const version = hash.digest('hex').slice(0, 10);
// 4. versión en errors.js
const ej = path.join(OUT, 'errors.js'); if (fs.existsSync(ej)) fs.writeFileSync(ej, `window.LC_VERSION=${JSON.stringify(version)};\n` + fs.readFileSync(ej, 'utf8'));
// 3. caché del service worker
const sw = path.join(OUT, 'sw.js');
fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/const CACHE = '[^']*';/, `const CACHE = 'lliga-${version}';`));
// 2. minimizar
let saved = 0, before = 0;
if (esbuild) for (const f of fs.readdirSync(OUT).filter(f => /\.(js|css)$/.test(f))) {
  const p = path.join(OUT, f), src = fs.readFileSync(p, 'utf8');
  // config.js y club-config.js se dejan legibles (son configuración)
  if (/^(config|club-config)\.js$/.test(f)) continue;
  const r = esbuild.transformSync(src, { loader: f.endsWith('.css') ? 'css' : 'js', minify: true, legalComments: 'none', target: f.endsWith('.css') ? ['chrome100', 'safari15'] : 'es2020', charset: 'utf8' });
  fs.writeFileSync(p, r.code); before += src.length; saved += src.length - r.code.length;
}
console.log(`[build] dist/ lista · versión ${version} · app.js con ${parts.length} partes · minimizado: ${Math.round(before / 1024)} KB → ${Math.round((before - saved) / 1024)} KB`);
