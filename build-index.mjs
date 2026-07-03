// Valide les entries/*.dboard et génère index.json. Sans dépendance npm : Ajv vendorisé (parité designer)
// + schéma partagé. `validateEntry` est PUR (testé node) ; le CLI (walk fs + --check/write) est gardé.
//
//   node build-index.mjs           → écrit index.json (mode build, pour main)
//   node build-index.mjs --check    → valide seulement, exit 1 si une entrée invalide (mode PR)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv from './vendor/ajv.min.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
export const DOMAINS = ['time', 'weather', 'finance', 'system', 'home', 'transit', 'health', 'fun', 'other'];
export const MAX_BYTES = 512 * 1024;   // plafond d'un .dboard (base64 des assets inclus)

const schema = JSON.parse(readFileSync(join(ROOT, 'schema', 'layout.schema.json'), 'utf8'));
const validateShape = new Ajv({ allErrors: true, strict: false }).compile(schema);

// (rel, bytes, obj) → { entry } | { errors:[...], rel }. Pur : aucune I/O.
export function validateEntry(rel, bytes, o) {
  const errors = [];
  if (bytes > MAX_BYTES) errors.push(`taille ${bytes} > ${MAX_BYTES} octets`);
  if (!o || typeof o !== 'object') return { errors: ['fichier non-objet'], rel };
  if (o.version !== 1 && o.version !== 2) errors.push(`version ${o.version} non supportée (attendu 1|2)`);

  const m = (o.meta && typeof o.meta === 'object') ? o.meta : {};
  for (const k of ['name', 'author', 'description', 'domain'])
    if (typeof m[k] !== 'string' || !m[k]) errors.push(`meta.${k} manquant ou vide`);
  if (m.domain && !DOMAINS.includes(m.domain)) errors.push(`meta.domain « ${m.domain} » hors enum`);

  const layout = o.layout;
  if (!layout || typeof layout !== 'object') { errors.push('layout manquant'); return { errors, rel }; }

  // Forme (Ajv, schéma partagé) — parité designer/firmware
  if (!validateShape(layout)) {
    for (const e of validateShape.errors) {
      if (e.keyword === 'const' && e.instancePath.endsWith('/type')) continue;   // bruit oneOf (cf. designer validate.js)
      errors.push(`layout${e.instancePath} ${e.message}`);
    }
  }
  // Résolution des ref (invariant sémantique non exprimé par le schéma)
  const ids = new Set(Object.keys(layout.components || {}));
  (Array.isArray(layout.pages) ? layout.pages : []).forEach((pg, pi) =>
    (Array.isArray(pg && pg.place) ? pg.place : []).forEach(pl => {
      if (pl && pl.ref !== undefined && !ids.has(pl.ref)) errors.push(`page ${pi + 1} : ref « ${pl.ref} » inconnue`);
    }));

  if (errors.length) return { errors, rel };
  return { entry: {
    id: rel.replace(/\.dboard$/, ''),
    file: `entries/${rel}`,
    name: m.name, author: m.author, description: m.description, domain: m.domain,
    tags: Array.isArray(m.tags) ? m.tags.filter(t => typeof t === 'string') : [],
    requires: typeof m.requires === 'string' ? m.requires : '',
    bytes,
    layout,   // les assets vivent dans o.assets (séparés) → le layout est naturellement sans octets
  } };
}

// --- CLI (non exécuté à l'import) ---
function listEntries(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listEntries(p));
    else if (name.endsWith('.dboard')) out.push(p);
  }
  return out;
}

function main() {
  const check = process.argv.includes('--check');
  const entriesDir = join(ROOT, 'entries');
  const files = listEntries(entriesDir).sort();
  const entries = [];
  let bad = 0;
  for (const f of files) {
    const rel = relative(entriesDir, f).split(sep).join('/');
    const bytes = statSync(f).size;
    let obj;
    try { obj = JSON.parse(readFileSync(f, 'utf8')); }
    catch (e) { bad++; console.error(`✗ ${rel}\n  - JSON invalide : ${e.message}`); continue; }
    const r = validateEntry(rel, bytes, obj);
    if (r.errors && r.errors.length) { bad++; console.error(`✗ ${rel}\n  - ${r.errors.join('\n  - ')}`); }
    else { entries.push(r.entry); console.log(`✓ ${r.entry.id}`); }
  }
  if (bad) { console.error(`\n${bad} entrée(s) invalide(s).`); process.exit(1); }
  if (check) { console.log(`\n${entries.length} entrée(s) valide(s) — --check, index.json non modifié.`); return; }
  writeFileSync(join(ROOT, 'index.json'), JSON.stringify(entries, null, 2) + '\n');
  console.log(`\nindex.json écrit — ${entries.length} entrée(s).`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
