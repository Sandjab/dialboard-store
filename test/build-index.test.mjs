import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry } from '../build-index.mjs';

const goodLayout = { title: 'Clock', background: '#000000', components: { a: { type: 'label', text: 'Hi', font: 18, color: '#ffffff' } }, pages: [{ name: 'p', place: [{ ref: 'a', anchor: 'CENTER' }] }] };
const goodMeta = { name: 'Horloge', author: 'me', description: 'demo', domain: 'time', tags: ['clock'], requires: '' };
const dboard = (over = {}) => ({ version: 2, meta: goodMeta, layout: goodLayout, assets: { bg: {}, image: {}, aimg: {} }, ...over });

test('validateEntry : une entrée valide produit une ligne d\'index (intent : le happy path alimente le catalogue)', () => {
  const r = validateEntry('me/clock.dboard', 400, dboard());
  assert.ok(r.entry, 'devrait renvoyer entry, erreurs: ' + JSON.stringify(r.errors));
  assert.equal(r.entry.id, 'me/clock');
  assert.equal(r.entry.file, 'entries/me/clock.dboard');
  assert.equal(r.entry.domain, 'time');
  assert.equal(r.entry.bytes, 400);
  assert.deepEqual(r.entry.layout, goodLayout);      // layout embarqué pour la miniature
});

test('validateEntry : rejette une propriété inconnue (intent : la forme est gardée par le schéma partagé)', () => {
  const bad = dboard({ layout: { ...goodLayout, components: { a: { type: 'label', text: 'Hi', font: 18, color: '#fff', bogus: 1 } } } });
  const r = validateEntry('me/x.dboard', 400, bad);
  assert.ok(r.errors && r.errors.length, 'devrait rejeter la prop inconnue');
});

test('validateEntry : rejette une ref pendante (intent : invariant sémantique non exprimé par le schéma)', () => {
  const bad = dboard({ layout: { ...goodLayout, pages: [{ name: 'p', place: [{ ref: 'ghost', anchor: 'CENTER' }] }] } });
  const r = validateEntry('me/x.dboard', 400, bad);
  assert.ok(r.errors.some(e => /ref/.test(e)), 'devrait signaler la ref inconnue : ' + JSON.stringify(r.errors));
});

test('validateEntry : rejette meta incomplète (intent : la galerie a besoin de nom/domaine)', () => {
  const bad = dboard({ meta: { name: '', author: 'me', description: 'd', domain: 'time' } });
  const r = validateEntry('me/x.dboard', 400, bad);
  assert.ok(r.errors.some(e => /meta\.name/.test(e)));
});

test('validateEntry : rejette un domaine hors enum (intent : taxonomie fermée)', () => {
  const bad = dboard({ meta: { ...goodMeta, domain: 'zzz' } });
  const r = validateEntry('me/x.dboard', 400, bad);
  assert.ok(r.errors.some(e => /domain/.test(e)));
});

test('validateEntry : rejette au-delà du plafond de taille (intent : garder le repo/CDN léger)', () => {
  const r = validateEntry('me/x.dboard', 600 * 1024, dboard());
  assert.ok(r.errors.some(e => /taille|octets/.test(e)));
});

test('validateEntry : accepte v1 comme v2 (intent : rétro-compat des exports legacy)', () => {
  const r = validateEntry('me/x.dboard', 400, dboard({ version: 1 }));
  assert.ok(r.entry, 'v1 doit rester accepté : ' + JSON.stringify(r.errors));
});
