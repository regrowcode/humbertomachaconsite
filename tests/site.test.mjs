import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { translations } from '../src/translations.js';
import { contactInterests, getServiceKey, projectFields, getProjectLines } from '../src/advisory.js';

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
    const destinations = [...header.matchAll(/href="([^"]+)"/g)].map((match) => match[1]).filter((href) => href.startsWith('/'));
    assert.deepEqual(destinations, ['/', '/sobre-mi.html', '/servicios.html', '/zonas.html', '/contacto.html']);
    assert.ok(!header.includes('btn-header-cta'), 'Appointment CTA is replaced by direct calling');
    const callLink = header.match(/<a\b[^>]*id="header-call-link"[^>]*>[\s\S]*?<\/a>/)?.[0];
    assert.ok(callLink?.includes('aria-label="Llamar a Humberto"'));
    assert.ok(callLink?.includes('aria-hidden="true"'));
    assert.match(callLink, /href="tel:\+\d+"/);
    assert.ok(header.includes('data-i18n="nav.about">Sobre Mí'));
    assert.ok(header.includes('data-i18n="nav.services">Servicios'));
    assert.ok(header.includes('data-i18n="nav.locations">Zonas'));
    assert.ok(!header.includes('dropdown'), 'Services and areas are independent links');

    for (const match of html.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g)) {
      for (const lang of ['es', 'en', 'de']) {
        assert.equal(typeof resolveKey(translations[lang], match[1]), 'string', `${lang}: missing ${match[1]}`);
      }
    }
    for (const [lang, label] of Object.entries({ es: 'Español', en: 'English', de: 'Deutsch' })) {
      assert.match(header, new RegExp(`data-lang="${lang}"[^>]*aria-label="${label}"`));
      assert.ok(header.includes(`/images/flags/${lang}.svg`));
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

test('Navbar uses concise independent area labels in all three languages', () => {
  assert.deepEqual(translations.es.nav, { home: 'Inicio', about: 'Sobre Mí', services: 'Servicios', allServices: 'Servicios de Asesoramiento', locations: 'Zonas', contact: 'Contacto', cta: 'Agendar Cita' });
  assert.deepEqual(translations.en.nav, { home: 'Home', about: 'About Me', services: 'Services', allServices: 'Advisory Services', locations: 'Areas', contact: 'Contact', cta: 'Book Consultation' });
  assert.equal(translations.de.nav.locations, 'Regionen');
});

test('Four advisory actions link to the correct inquiry context', async () => {
  const html = await readFile(new URL('../servicios.html', import.meta.url), 'utf8');
  assert.equal([...html.matchAll(/class="advisory-action"/g)].length, 4);
  for (const service of ['valorar', 'comprar', 'invertir', 'vender']) {
    assert.ok(html.includes(`href="/contacto.html?servicio=${service}#form"`));
    const key = getServiceKey(service);
    assert.ok(key);
    for (const lang of ['es', 'en', 'de']) {
      for (const field of ['category', 'label', 'description', 'formTitle', 'formDescription']) {
        assert.ok(translations[lang].serviceActions[key][field].trim());
      }
      assert.equal(translations[lang].contact.interestOptions.length, contactInterests.length);
      for (const field of projectFields) assert.ok(translations[lang].contact[field.name]);
    }
  }
  for (const invalid of ['unknown', '__proto__', 'toString', null]) assert.equal(getServiceKey(invalid), null);
});

test('Inquiry includes only populated fields relevant to the selected action', () => {
  const data = new FormData();
  data.set('projectLocation', 'Málaga');
  data.set('budget', '350000');
  data.set('area', '90');
  data.set('rooms', '3');
  data.set('investmentGoal', '10 años');
  for (const lang of ['es', 'en', 'de']) {
    const labels = translations[lang].contact;
    assert.deepEqual(getProjectLines(data, labels, 'valorar'), [`${labels.projectLocation}: Málaga`, `${labels.area}: 90`, `${labels.rooms}: 3`]);
    assert.deepEqual(getProjectLines(data, labels, 'invertir'), [`${labels.projectLocation}: Málaga`, `${labels.budget}: 350000`, `${labels.area}: 90`, `${labels.investmentGoal}: 10 años`]);
    assert.deepEqual(getProjectLines(data, labels, 'otra'), []);
  }
});

test('German translations cover the complete dictionary, including lists', () => {
  function verify(reference, german, path = '') {
    for (const [key, value] of Object.entries(reference)) {
      const location = `${path}${key}`;
      if (Array.isArray(value)) {
        assert.ok(Array.isArray(german?.[key]), location);
        assert.equal(german[key].length, value.length, location);
        german[key].forEach((item) => assert.ok(typeof item === 'string' && item.trim(), location));
      } else if (typeof value === 'object') {
        verify(value, german?.[key], `${location}.`);
      } else {
        assert.ok(typeof german?.[key] === 'string' && german[key].trim(), location);
      }
    }
  }
  verify(translations.es, translations.de);
});
