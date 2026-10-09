import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { translations } from '../src/translations.js';

const pages = ['index.html', 'sobre-mi.html', 'servicios.html', 'zonas.html', 'contacto.html'];
const resolveKey = (object, key) => key.split('.').reduce((value, part) => value?.[part], object);

for (const page of pages) {
  test(`${page}: markup, translations, navigation and local assets`, async () => {
    const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
    assert.equal([...html.matchAll(/<main\b/g)].length, 1);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, 'IDs must be unique');

    const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0];
    assert.ok(header);
    const destinations = [...header.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(destinations, ['/', '/sobre-mi.html', '/servicios.html', '/servicios.html', '/zonas.html', '/contacto.html', '/contacto.html']);
    assert.ok(header.includes('data-i18n="nav.about">Sobre Mí'));
    assert.ok(header.includes('data-i18n="nav.allServices">Servicios de Asesoramiento'));
    assert.ok(header.includes('data-i18n="nav.locations">Zonas de Málaga'));

    for (const match of html.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g)) {
      for (const lang of ['es', 'en']) {
        assert.equal(typeof resolveKey(translations[lang], match[1]), 'string', `${lang}: missing ${match[1]}`);
      }
    }
    const assets = [...html.matchAll(/(?:src|data-src|poster|href)="(\/[^"?#]+)"/g)].map((match) => match[1]);
    for (const asset of new Set(assets)) {
      if (asset === '/') continue;
      const location = asset.startsWith('/images/') || asset.startsWith('/videos/') ? `public${asset}` : asset.slice(1);
      assert.ok((await stat(new URL(`../${location}`, import.meta.url))).isFile(), `${asset} is missing`);
    }
  });
}

test('New films are local, compact and poster-first', async () => {
  for (const clip of ['coastal-life', 'personal-advisory', 'a-new-chapter']) {
    const metadata = await stat(new URL(`../public/videos/${clip}.mp4`, import.meta.url));
    assert.ok(metadata.size > 100_000 && metadata.size < 2_500_000);
  }
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal([...home.matchAll(/data-ambient-video/g)].length, 3);
  assert.equal([...home.matchAll(/preload="none"/g)].length, 3);
  assert.ok(!home.includes('/videos/hero-video.mp4'));
  assert.ok(!home.includes('testimonials.t'));
});

test('Navbar wording remains unchanged in both languages', () => {
  assert.deepEqual(translations.es.nav, { home: 'Inicio', about: 'Sobre Mí', services: 'Servicios', allServices: 'Servicios de Asesoramiento', locations: 'Zonas de Málaga', contact: 'Contacto', cta: 'Agendar Cita' });
  assert.deepEqual(translations.en.nav, { home: 'Home', about: 'About Me', services: 'Services', allServices: 'Advisory Services', locations: 'Málaga Areas', contact: 'Contact', cta: 'Book Consultation' });
});
