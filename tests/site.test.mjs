import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { translations } from '../src/translations.js';
import { contactInterests, getServiceKey, projectFields, getProjectLines } from '../src/advisory.js';
import { coastalAreas } from '../src/coast.js';

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
    assert.ok(!header.includes('brand-monogram'), 'Header shows the advisor name without the HM monogram');
    assert.ok(header.includes('<span class="brand-name">Humberto Machacón</span>'));
    assert.ok(header.includes('<span class="brand-subtitle">Real Estate Advisor</span>'));
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

    for (const match of html.matchAll(/data-i18n(?:-placeholder|-aria-label)?="([^"]+)"/g)) {
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

test('Shared footer has three actions, two socials and four advisory pillars', async () => {
  for (const page of pages) {
    const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
    const banner = html.match(/<section class="consultation-banner">[\s\S]*?<\/section>/)?.[0];
    assert.ok(banner, page);
    assert.ok(!/<(?:h2|p)\b/.test(banner), 'No promotional copy in the action strip');
    assert.ok(!banner.includes('humberto-avatar'), 'No advisor portrait in the action strip');
    const buttons = banner.match(/<div class="consultation-buttons">[\s\S]*?<\/div>/)?.[0];
    assert.equal([...buttons.matchAll(/<a\b/g)].length, 3);
    const call = buttons.match(/<a\b[^>]*class="[^"]*footer-call-link[^"]*"[^>]*>/)?.[0];
    assert.match(call, /href="https:\/\/wa\.me\/34681816023\?text=/);
    assert.ok(call.includes('target="_blank"'));
    assert.ok(buttons.includes('whatsapp-direct-link'));
    assert.ok(buttons.includes('data-i18n="nav.cta"'));
    assert.deepEqual([...banner.matchAll(/data-social="([^"]+)"/g)].map((match) => match[1]), ['linkedin', 'instagram']);
    for (const [social, label] of Object.entries({ linkedin: 'LinkedIn', instagram: 'Instagram' })) {
      const link = banner.match(new RegExp(`<a[^>]*data-social="${social}"[^>]*>[\\s\\S]*?<\\/a>`))?.[0];
      assert.ok(link.includes(`aria-label="${label}"`));
      assert.ok(link.includes(`src="/images/${social}.svg"`));
    }
    const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];
    assert.ok(!footer.includes('brand-monogram'), 'Footer shows the advisor name without the HM monogram');
    assert.match(footer, /class="brand-subtitle"[^>]*>REAL ESTATE ADVISOR<\/span>/);
    assert.deepEqual([...footer.matchAll(/<h4[^>]*data-i18n="([^"]+)"/g)].map((match) => match[1]), ['footer.servicesList', 'nav.locations', 'nav.contact']);
    for (const service of ['valorar', 'comprar', 'invertir', 'vender']) {
      assert.ok(footer.includes(`href="/contacto.html?servicio=${service}#form"`));
    }
    for (const key of ['value', 'buy', 'invest', 'sell']) {
      assert.ok(footer.includes(`data-i18n="footer.${key}"`));
      for (const lang of ['es', 'en', 'de']) {
        const phrase = translations[lang].footer[key];
        assert.ok(phrase.includes(' '), 'Service links use inviting phrases');
        assert.notEqual(phrase, phrase.toUpperCase());
      }
    }
    for (const area of ['Málaga', 'Torremolinos', 'Benalmádena', 'Fuengirola', 'Mijas', 'Marbella', 'Estepona']) {
      assert.ok(footer.includes(area), `${page}: ${area}`);
    }
  }
});

test('Navbar uses concise independent area labels in all three languages', () => {
  assert.deepEqual(translations.es.nav, { home: 'Inicio', about: 'Sobre Mí', services: 'Servicios', allServices: 'Servicios de Asesoramiento', locations: 'Zonas', contact: 'Contacto', cta: 'Agendar Cita' });
  assert.deepEqual(translations.en.nav, { home: 'Home', about: 'About Me', services: 'Services', allServices: 'Advisory Services', locations: 'Areas', contact: 'Contact', cta: 'Book Consultation' });
  assert.equal(translations.de.nav.locations, 'Regionen');
});

test('Costa del Sol gallery covers seven real areas with lazy portrait films', async () => {
  const html = await readFile(new URL('../zonas.html', import.meta.url), 'utf8');
  assert.equal([...html.matchAll(/class="coast-card"/g)].length, 7);
  assert.equal([...html.matchAll(/data-ambient-video/g)].length, 6, 'Mijas is honestly presented as a photograph');
  assert.ok(!html.includes('property-card'));
  assert.ok(html.includes('coast.photoPending'));
  assert.ok(html.includes('data-zone-previous') && html.includes('data-zone-next'));
  assert.ok(html.includes('id="coast-gallery" tabindex="0"'));
  for (const key of ['areaCta', 'swipe', 'galleryNote', 'mediaNote']) {
    assert.ok(!html.includes(`data-i18n="coast.${key}"`), `${key} removed from the gallery`);
  }
  const cardCopies = [...html.matchAll(/<div class="coast-card-copy">([\s\S]*?)<\/div>/g)];
  assert.equal(cardCopies.length, 7);
  assert.ok(cardCopies.every((match) => !match[1].includes('<a ')), 'No contact links below area descriptions');
  for (const [slug, name] of Object.entries(coastalAreas)) {
    assert.ok(html.includes(`id="zona-${slug}"`), name);
    assert.ok(html.includes(`href="#zona-${slug}"`), name);
    const poster = await stat(new URL(`../public/images/zone-${slug}.webp`, import.meta.url));
    assert.ok(poster.size > 1000 && poster.size < 250_000);
    if (slug === 'mijas') continue;
    const video = html.match(new RegExp(`<video id="${slug}-film"[^>]*>[\\s\\S]*?<\\/video>`))?.[0];
    assert.ok(video.includes('muted loop playsinline preload="none"'));
    assert.ok(video.includes(`poster="/images/zone-${slug}.webp"`));
    assert.ok(video.includes(`data-src="/videos/zone-${slug}.mp4"`));
    assert.ok(!/\ssrc=/.test(video), 'Video bytes must not load before visibility or manual request');
    assert.ok(html.includes(`data-video-toggle="${slug}-film"`));
    const metadata = await stat(new URL(`../public/videos/zone-${slug}.mp4`, import.meta.url));
    assert.ok(metadata.size > 100_000 && metadata.size < 2_500_000);
  }
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
