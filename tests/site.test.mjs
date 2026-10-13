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

    for (const match of html.matchAll(/data-i18n(?:-placeholder|-aria-label|-alt)?="([^"]+)"/g)) {
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

test('Retained films are compact and the homepage hero stays poster-first', async () => {
  for (const clip of ['coastal-life', 'personal-advisory', 'a-new-chapter']) {
    const metadata = await stat(new URL(`../public/videos/${clip}.mp4`, import.meta.url));
    assert.ok(metadata.size > 100_000 && metadata.size < 2_500_000);
  }
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal([...home.matchAll(/data-ambient-video/g)].length, 1);
  assert.equal([...home.matchAll(/preload="none"/g)].length, 1);
  assert.ok(home.includes('data-video-toggle="hero-film"'));
  assert.ok(!home.includes('advisory-film') && !home.includes('chapter-film'));
  assert.ok(!home.includes('/videos/hero-video.mp4'));
  assert.ok(!home.includes('testimonials.t'));
});

test('Client phrases anchor the hero, service carousel and personal introduction', async () => {
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const hero = home.match(/<section class="hero-section"[\s\S]*?<\/section>/)[0];
  assert.ok(hero.includes('Te escucho, te guío'));
  assert.ok(hero.includes('y te acompaño.'));
  assert.ok(hero.includes('En cada paso, para que tomes la decisión correcta.'));
  const method = home.match(/<section class="services-section home-methodology"[\s\S]*?<\/section>/)[0];
  assert.ok(method.includes('Comprar o vender una propiedad trae muchas preguntas. Estoy aquí para ayudarte a resolverlas'));
  assert.equal(translations.es.aboutPreview.quote, '«Antes de hablar de tu inversión, hablemos de lo que realmente necesitas.»');
  assert.ok(home.includes(translations.es.aboutPreview.quote));
  assert.ok(translations.es.serviceActions.invest.formDescription.startsWith('Antes de hablar de tu inversión, hablemos de lo que realmente necesitas.'));
});

test('Conversational Spanish copy stays consistent without JavaScript', async () => {
  const updatedKeys = /^(?:hero\.(?:titleStart|titleAccent|subtitle)|aboutPreview\.(?:quote|p1|p2)|aboutPage\..+|method\.(?:title|intro|step3|desc\d)|faq\.[qa]\d|serviceActions\..+|home\.(?:apartmentsDesc|penthousesDesc|villasDesc)|contact\.(?:title|subtitle|personalTitle|personalDesc|advisorNote|formInterest|formMessage|disclaimer)|coast\.(?:intro|guidanceTitle|guidanceDescription|\w+\.description)|footer\.bio|locations\.subtitle|editorial\.locationsTitle)$/;
  const decode = text => text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
  for (const page of pages) {
    const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
    for (const match of html.matchAll(/<([a-z][\w-]*)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>([^<]*)<\/\1>/g)) {
      if (!updatedKeys.test(match[2]) && !match[2].startsWith('homeServices.') && !/^home\.(?:flats|apartments|duplexes|penthouses|chalet|villas|land)(?:Label|Title|Desc|Cta)$/.test(match[2])) continue;
      const text = decode(match[3].trim());
      assert.equal(text, resolveKey(translations.es, match[2]), `${page}: ${match[2]} fallback`);
      assert.ok(!/\b(?:usted|asesorarle|confíenos|estime su|en qué desea|sus datos|su búsqueda)\b/i.test(text), `${page}: ${match[2]} uses a personal tone`);
    }
  }
  const contact = await readFile(new URL('../contacto.html', import.meta.url), 'utf8');
  const options = [...contact.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)];
  assert.deepEqual(options.map(match => match[1]), contactInterests);
  assert.deepEqual(options.map(match => decode(match[2])), translations.es.contact.interestOptions);
  assert.ok(translations.es.contact.formHint.includes('prepara un correo'));
  assert.ok(translations.es.contact.successDesc.includes('Aún no se ha enviado desde esta web'));
});

test('Homepage has four advisory services, seven areas and property guidance', async () => {
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const about = await readFile(new URL('../sobre-mi.html', import.meta.url), 'utf8');
  const hero = home.match(/<section class="hero-section"[\s\S]*?<\/section>/)[0];
  assert.ok(!hero.includes('humberto-suit') && !hero.includes('hero-advisor-link'));
  const advisor = home.match(/<section class="about-section"[\s\S]*?<\/section>/)[0];
  assert.ok(!advisor.includes('aboutPreview.tag'));
  assert.ok(advisor.includes('data-i18n="aboutPreview.title"'));
  for (const anchor of ['mi-historia', 'mi-experiencia']) {
    assert.ok(advisor.includes(`href="/sobre-mi.html#${anchor}"`));
    assert.ok(about.includes(`id="${anchor}"`));
  }
  const method = home.match(/<section class="services-section home-methodology"[\s\S]*?<\/section>/)[0];
  assert.equal([...method.matchAll(/data-gallery-card/g)].length, 4);
  assert.ok(method.includes('data-gallery-single'));
  assert.ok(method.includes('data-gallery-autoplay="6500"'));
  assert.ok(method.includes('data-gallery-playback'));
  assert.ok(method.includes('data-i18n="homeServices.title"'));
  assert.ok(!method.includes('data-i18n="method.step') && !method.includes('data-i18n="method.desc'));
  assert.ok(!method.includes('Cuatro etapas'));
  const services = await readFile(new URL('../servicios.html', import.meta.url), 'utf8');
  for (const [service, key] of [['comprar', 'buy'], ['vender', 'sell'], ['invertir', 'invest'], ['valorar', 'value']]) {
    assert.ok(method.includes(`data-gallery-service="${service}"`));
    assert.ok(method.includes(`data-i18n="homeServices.${key}Title"`));
    assert.ok(method.includes(`href="/servicios.html#${service}"`));
    assert.ok(services.includes(`id="${service}" data-service="${service}"`));
  }
  for (let stage = 1; stage <= 4; stage++) assert.ok(services.includes(`data-i18n="method.step${stage}"`), 'The separate service-page methodology remains intact');
  assert.deepEqual([...method.matchAll(/data-gallery-service="([^"]+)"/g)].map(match => match[1]), ['comprar', 'vender', 'invertir', 'valorar']);
  assert.ok(method.includes('no una tasación oficial'));
  assert.ok(method.includes('sin promesas de rentabilidad'));
  const zones = home.match(/<section class="destinations-section home-zones"[\s\S]*?<\/section>/)[0];
  assert.ok(!zones.includes('data-gallery-autoplay'), 'Autoplay is limited to the requested methodology carousel');
  assert.equal([...zones.matchAll(/data-gallery-card/g)].length, 7);
  for (const [slug, name] of Object.entries(coastalAreas)) {
    assert.ok(zones.includes(`href="/zonas.html#zona-${slug}"`), name);
    assert.ok(zones.includes(`src="/images/zone-${slug}.webp"`), name);
  }
  for (const section of [method, zones]) {
    assert.ok(section.includes('data-gallery-previous') && section.includes('data-gallery-next'));
    assert.match(section, /data-gallery-track tabindex="0" role="region" aria-label(?:ledby)?=/);
    assert.ok(!section.includes('<video'));
  }
  assert.ok(!home.includes('films-section') && !home.includes('method-section'));
  assert.ok(home.includes('data-i18n="home.propertyTitle"'));
  for (const type of ['flats', 'apartments', 'duplexes', 'penthouses', 'chalet', 'villas', 'land']) {
    assert.ok(home.includes(`data-i18n="home.${type}Title"`));
    assert.ok(home.includes(`data-i18n="home.${type}Desc"`));
  }
  assert.ok(method.includes('data-i18n="homeServices.imageNote"'));
});

test('Service carousel uses full-width slides with relevant, compact and credited photographs', async () => {
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const method = home.match(/<section class="services-section home-methodology"[\s\S]*?<\/section>/)[0];
  const credits = await readFile(new URL('../public/videos/CREDITS.md', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/editorial.css', import.meta.url), 'utf8');
  assert.match(css, /\.methodology-card\s*\{[^}]*flex:\s*0 0 100%;/);
  assert.match(css, /\.methodology-track\s*\{\s*gap:\s*0;/);
  assert.ok(!css.includes('.methodology-card, .home-zone-card'), 'Mobile zone sizing must not shrink methodology slides');
  const scenes = [['planning', 2], ['support', 4], ['review', 3], ['listening', 1]];
  const cards = [...method.matchAll(/<article\b[^>]*data-gallery-card[\s\S]*?<\/article>/g)].map(match => match[0]);
  for (const [index, [scene, alt]] of scenes.entries()) {
    const file = `method-${scene}.webp`;
    assert.ok(cards[index].includes(`src="/images/${file}"`));
    assert.ok(cards[index].includes(`data-i18n-alt="method.image${alt}Alt"`));
    const metadata = await stat(new URL(`../public/images/${file}`, import.meta.url));
    assert.ok(metadata.size > 1000 && metadata.size < 250_000);
    assert.ok(credits.includes(file));
  }
  for (const oldImage of ['malaga-centro', 'hero-villa', 'humberto-suit-navy', 'personal-advisory']) {
    assert.ok(!method.includes(`/images/${oldImage}.webp`));
  }
});

test('Seven property types use a selector above the photo and a description to its right', async () => {
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const section = home.match(/<section class="home-property-types"[\s\S]*?<\/section>/)[0];
  assert.ok(section.includes('data-property-showcase'));
  assert.ok(!section.includes('home-property-grid') && !section.includes('home-property-card'));
  assert.equal([...section.matchAll(/data-property-tab\b/g)].length, 7);
  assert.equal([...section.matchAll(/data-property-panel\b/g)].length, 7);
  assert.ok(section.includes('data-i18n-aria-label="home.propertySelect"'));
  const types = ['flats', 'apartments', 'duplexes', 'penthouses', 'chalet', 'villas', 'land'];
  assert.deepEqual([...section.matchAll(/data-property-tab data-i18n="home\.([^"]+)Label"/g)].map(match => match[1]), types);
  assert.deepEqual(types.map(type => translations.es.home[`${type}Label`]), ['Pisos', 'Apartamentos', 'Dúplex', 'Áticos', 'Chalet', 'Villas', 'Terrenos']);
  for (const type of types) {
    assert.ok(section.includes(`href="#property-${type}"`));
    assert.ok(section.includes(`id="property-${type}" data-property-panel aria-labelledby="property-tab-${type}"`));
    for (const suffix of ['Label', 'Title', 'Desc', 'Cta']) {
      assert.ok(section.includes(`data-i18n="home.${type}${suffix}"`));
    }
  }
  assert.equal([...section.matchAll(/href="\/contacto.html\?servicio=comprar#form"/g)].length, 7);
  assert.ok(!section.includes(' hidden'), 'All categories remain available without JavaScript');
  assert.equal(new Set([...section.matchAll(/src="([^"]+)"/g)].map(match => match[1])).size, 7);
  assert.ok(section.includes('data-i18n="home.propertyImageNote"'));
  assert.ok(section.includes('no todo terreno permite construir'));
  const css = await readFile(new URL('../src/editorial.css', import.meta.url), 'utf8');
  assert.ok(!css.includes('.property-types-ready .property-types-selector { position: absolute'));
  assert.ok(!css.includes('padding-top: 164px'));
  const script = await readFile(new URL('../src/property-types.js', import.meta.url), 'utf8');
  assert.ok(script.includes("selector.setAttribute('aria-orientation', 'horizontal')"));
  const credits = await readFile(new URL('../public/videos/CREDITS.md', import.meta.url), 'utf8');
  for (const type of ['flats', 'apartments', 'duplexes', 'chalet', 'land']) {
    const filename = `property-${type}.webp`;
    assert.ok(credits.includes(filename));
    const metadata = await stat(new URL(`../public/images/${filename}`, import.meta.url));
    assert.ok(metadata.size > 1000 && metadata.size < 250_000);
  }
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
