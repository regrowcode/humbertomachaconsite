import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { translations } from '../src/translations.js';
import { contactInterests, getServiceKey, projectFields, getProjectLines } from '../src/advisory.js';
import { coastalAreas } from '../src/coast.js';
import { siteConfig } from '../src/config.js';

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
    const assets = [...html.matchAll(/(?:src|data-src|poster|href)="(\/[^"?#]+)"/g)].map((match) => match[1]);
    for (const asset of new Set(assets)) {
      if (asset === '/') continue;
      const location = asset.startsWith('/images/') || asset.startsWith('/videos/') ? `public${asset}` : asset.slice(1);
      assert.ok((await stat(new URL(`../${location}`, import.meta.url))).isFile(), `${asset} is missing`);
    }
  });
}

test('Every header has a flag-free language dropdown with Spanish selected by default', async () => {
  for (const page of pages) {
    const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
    const header = html.match(/<header\b[\s\S]*?<\/header>/)[0];
    const languageSelect = header.match(/<select\b[^>]*id="lang-switcher"[^>]*>[\s\S]*?<\/select>/)?.[0];
    assert.ok(languageSelect?.includes('aria-label="Seleccionar idioma"'), page);
    assert.deepEqual([...languageSelect.matchAll(/<option value="([^"]+)"/g)].map(match => match[1]), ['es', 'en', 'de']);
    assert.match(languageSelect, /<option value="es" lang="es" selected>Español<\/option>/);
    assert.equal([...languageSelect.matchAll(/\bselected\b/g)].length, 1);
    for (const [lang, label] of Object.entries({ es: 'Español', en: 'English', de: 'Deutsch' })) {
      assert.match(languageSelect, new RegExp(`<option value="${lang}" lang="${lang}"[^>]*>${label}</option>`));
    }
    assert.ok(!header.includes('/images/flags/') && !header.includes('lang-btn'), 'Language options have no flags or toggle buttons');
  }
});

test('Retained films are compact and the homepage hero stays poster-first', async () => {
  for (const clip of ['coastal-life', 'personal-advisory', 'a-new-chapter', 'home-advisory', 'home-architecture']) {
    const metadata = await stat(new URL(`../public/videos/${clip}.mp4`, import.meta.url));
    assert.ok(metadata.size > 100_000 && metadata.size < 2_500_000);
  }
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal([...home.matchAll(/data-ambient-video/g)].length, 1);
  assert.equal([...home.matchAll(/preload="none"/g)].length, 1);
  assert.ok(home.includes('data-video-toggle="hero-film"'));
  assert.ok(!home.includes('advisory-film') && !home.includes('chapter-film'));
  assert.ok(!home.includes('/videos/hero-video.mp4'));
  assert.ok(!home.includes('/videos/coastal-life.mp4'));
  assert.ok(!home.includes('/videos/home-advisory.mp4'));
  assert.ok(home.includes('src="/images/home-architecture.webp"'));
  const heroVideo = home.match(/<video\b[^>]*id="hero-film"[^>]*>[\s\S]*?<\/video>/)[0];
  assert.match(heroVideo, /data-ambient-video muted loop playsinline/);
  assert.ok(heroVideo.includes('poster="/images/home-architecture.webp"'));
  assert.ok(heroVideo.includes('data-src="/videos/home-architecture.mp4"'));
  assert.ok(!heroVideo.includes('<source src='), 'The hero film stays lazy-loaded');
  assert.ok(home.includes('data-i18n="ui.heroVideoNote"'));
  for (const lang of ['es', 'en', 'de']) assert.ok(translations[lang].ui.heroVideoNote);
  const poster = await stat(new URL('../public/images/home-architecture.webp', import.meta.url));
  assert.ok(poster.size > 1000 && poster.size < 250_000);
  const credits = await readFile(new URL('../public/videos/CREDITS.md', import.meta.url), 'utf8');
  assert.ok(credits.includes('home-architecture.mp4') && credits.includes('34874524'));
  assert.equal(translations.es.ui.heroVideoNote, 'Interior ilustrativo. No es una propiedad en venta.');
  assert.ok(home.includes(translations.es.ui.heroVideoNote));
  assert.ok(!home.includes('testimonials.t'));
});

test('Client phrases anchor the hero, service list and personal introduction', async () => {
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const hero = home.match(/<section class="hero-section"[\s\S]*?<\/section>/)[0];
  assert.ok(hero.includes('Te escucho, te guío'));
  assert.ok(hero.includes('y te acompaño.'));
  assert.ok(hero.includes('Humberto Machacón · Asesor inmobiliario'));
  const services = home.match(/<section class="services-section home-services"[\s\S]*?<\/section>/)[0];
  assert.ok(services.includes('Comprar o vender una propiedad trae muchas preguntas. Estoy aquí no solo para resolverlas, sino también para darte la seguridad que necesitas.'));
  assert.ok(home.includes(translations.es.aboutPreview.storyLead));
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
  const interestSelect = contact.match(/<select\b[^>]*id="form-interest"[^>]*>[\s\S]*?<\/select>/)[0];
  const options = [...interestSelect.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)];
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
  assert.ok(advisor.includes('data-i18n="home.story"'));
  assert.ok(advisor.includes('data-i18n="aboutPreview.storyLead"'));
  for (const anchor of ['mi-historia', 'mi-experiencia']) {
    assert.ok(advisor.includes(`href="/sobre-mi.html#${anchor}"`));
    assert.ok(about.includes(`id="${anchor}"`));
  }
  const servicesSection = home.match(/<section class="services-section home-services"[\s\S]*?<\/section>/)[0];
  assert.ok(servicesSection.includes('data-i18n="homeServices.title"'));
  assert.equal([...servicesSection.matchAll(/class="advisory-action"/g)].length, 4);
  assert.ok(!servicesSection.includes('data-gallery-card') && !servicesSection.includes('data-gallery-autoplay'));
  assert.ok(!servicesSection.includes('data-i18n="method.step') && !servicesSection.includes('data-i18n="method.desc'));
  assert.ok(!servicesSection.includes('Cuatro etapas'));
  const servicesPage = await readFile(new URL('../servicios.html', import.meta.url), 'utf8');
  for (const [service, key] of [['vender', 'sell'], ['comprar', 'buy'], ['invertir', 'invest'], ['valorar', 'value']]) {
    assert.ok(servicesSection.includes(`data-i18n="serviceActions.pageTitles.${key}"`));
    assert.ok(servicesSection.includes(`data-i18n="serviceActions.pageDescriptions.${key}"`));
    assert.ok(servicesSection.includes(`href="/contacto.html?servicio=${service}#form"`));
    assert.ok(servicesPage.includes(`id="${service}" data-service="${service}"`));
  }
  for (let stage = 1; stage <= 4; stage++) assert.ok(servicesPage.includes(`data-i18n="method.step${stage}"`), 'The separate service-page methodology remains intact');
  const zones = home.match(/<section class="destinations-section home-zones"[\s\S]*?<\/section>/)[0];
  assert.ok(!zones.includes('data-gallery-autoplay'), 'The zones gallery does not autoplay');
  assert.equal([...zones.matchAll(/data-gallery-card/g)].length, 7);
  for (const [slug, name] of Object.entries(coastalAreas)) {
    assert.ok(zones.includes(`href="/zonas.html#zona-${slug}"`), name);
    assert.ok(zones.includes(`src="/images/zone-${slug}.webp"`), name);
  }
  assert.ok(zones.includes('data-gallery-previous') && zones.includes('data-gallery-next'));
  assert.match(zones, /data-gallery-track tabindex="0" role="region" aria-labelledby=/);
  assert.ok(!zones.includes('<video'));
  assert.ok(!home.includes('films-section') && !home.includes('method-section'));
  assert.ok(home.includes('data-i18n="home.propertyTitle"'));
  for (const type of ['flats', 'apartments', 'duplexes', 'penthouses', 'chalet', 'villas', 'land']) {
    assert.ok(home.includes(`data-i18n="home.${type}Title"`));
    assert.ok(home.includes(`data-i18n="home.${type}Desc"`));
  }
});

test('sobre-mi.html: large section titles, personal story and five commitments', async () => {
  const html = await readFile(new URL('../sobre-mi.html', import.meta.url), 'utf8');
  const story = html.match(/<section\b[^>]*id="mi-historia"[\s\S]*?<\/section>/)[0];
  assert.match(story, /<h2 class="section-title" data-i18n="aboutPage.commitmentTag2">Mi historia<\/h2>/);
  assert.ok(story.indexOf('aboutPage.commitmentTag2') < story.indexOf('class="about-portrait-wrap"'));
  assert.ok(story.includes('data-i18n="aboutPage.storyQuote"'));
  assert.ok(!story.includes('data-i18n="aboutPreview.quote"'), 'The homepage keeps its separate quote');
  assert.equal(translations.es.aboutPage.storyQuote, 'Detrás de mi forma de asesorar hay una historia. Esta es la mía.');

  const experience = html.match(/<section\b[^>]*id="mi-experiencia"[\s\S]*?<\/section>/)[0];
  assert.match(experience, /<h2 class="section-title" data-i18n="aboutPage.commitmentTag">Mi experiencia<\/h2>/);
  assert.match(experience, /<p class="section-subtitle-clean" data-i18n="aboutPage.commitmentTitle">Todo lo que he aprendido hoy está a tu servicio\.<\/p>/);
  assert.ok(!experience.includes('<a '), 'There is no appointment button in the experience section');

  const approach = html.match(/<section\b[^>]*id="mi-forma-de-asesorar"[\s\S]*?<\/section>/)[0];
  assert.match(approach, /<h2 class="section-title" data-i18n="aboutPage.tag">Mi forma de asesorar<\/h2>/);
  assert.match(approach, /<p class="section-subtitle-clean" data-i18n="aboutPage.title">Así trabajaremos juntos\.<\/p>/);
  const cards = [...approach.matchAll(/<div class="service-clean-card">[\s\S]*?<\/p>/g)].map(match => match[0]);
  assert.equal(cards.length, 5);
  assert.deepEqual([1, 2, 3, 4, 5].map(number => translations.es.aboutPage[`p${number}Title`]), [
    'Mi compromiso contigo', 'Hablarte claro', 'Respetar tus tiempos', 'Estar presente', 'Ser proactivo',
  ]);
  assert.deepEqual([1, 2, 3, 4, 5].map(number => translations.es.aboutPage[`p${number}Desc`]), [
    'Que sepas con quién cuentas, desde el primer día.',
    'Tendrás información clara y honesta aunque incomode, pero quiero apoyarte a tomar la mejor decisión.',
    'Te daré el espacio que necesites para decidir, sin presiones y con toda la información a tu alcance.',
    'Mantendré el contacto contigo, resolveré tus dudas y te informaré de cómo avanza cada paso y proceso.',
    'Me anticiparé, buscaré soluciones y te propondré pasos para evitar desilusiones.',
  ]);
  cards.forEach((card, index) => {
    const number = index + 1;
    assert.ok(card.includes(`<div class="service-number">0${number}</div>`));
    assert.ok(card.includes(`data-i18n="aboutPage.p${number}Title"`));
    assert.ok(card.includes(`data-i18n="aboutPage.p${number}Desc"`));
  });
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
    const callButton = buttons.match(/<a\b[^>]*class="[^"]*footer-call-link[^"]*"[^>]*>[\s\S]*?<\/a>/)[0];
    const messageButton = buttons.match(/<a\b[^>]*class="[^"]*whatsapp-direct-link[^"]*"[^>]*>[\s\S]*?<\/a>/)[0];
    for (const [button, key, label] of [[callButton, 'call', 'Llamada'], [messageButton, 'message', 'Mensaje']]) {
      assert.ok(button.includes('<svg ') && button.includes('aria-hidden="true"'), `${page}: ${key} icon`);
      assert.ok(button.includes(`<span data-i18n="footer.${key}">${label}</span>`));
      assert.ok(!/^<a\b[^>]*\sdata-i18n=/.test(button), 'Translating a label must not remove its icon');
      assert.match(button, /data-i18n-aria-label="[^"]+"/);
    }
    assert.ok(buttons.includes('whatsapp-direct-link'));
    const appointment = buttons.match(/<a\b[^>]*href="\/contacto\.html(?:#form)?"[^>]*>[\s\S]*?<\/a>/)?.[0];
    assert.ok(appointment?.includes('<svg ') && appointment.includes('aria-hidden="true"'), `${page}: appointment calendar icon`);
    assert.ok(appointment.includes('<span data-i18n="nav.cta">Agendar Cita</span>'));
    assert.ok(!/^<a\b[^>]*\sdata-i18n=/.test(appointment), 'Language changes preserve the calendar icon');
    assert.deepEqual([...banner.matchAll(/data-social="([^"]+)"/g)].map((match) => match[1]), ['linkedin', 'instagram']);
    for (const [social, label] of Object.entries({ linkedin: 'LinkedIn', instagram: 'Instagram' })) {
      const link = banner.match(new RegExp(`<a[^>]*data-social="${social}"[^>]*>[\\s\\S]*?<\\/a>`))?.[0];
      assert.ok(link.includes(`aria-label="${label}"`));
      assert.ok(link.includes(`src="/images/${social}.svg"`));
      const href = link.match(/href="([^"]+)"/)[1].replaceAll('&amp;', '&');
      assert.equal(href, siteConfig.socials[social], `${page}: ${social} profile matches configuration`);
      assert.ok(link.includes('target="_blank"') && link.includes('rel="noopener noreferrer"'));
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

test('Service area uses only Costa del Sol in contact details and combined descriptions', async () => {
  assert.equal(siteConfig.advisor.location, 'Costa del Sol, España');
  assert.equal(translations.es.contact.location, 'Costa del Sol, España');
  assert.equal(translations.en.contact.location, 'Costa del Sol, Spain');
  assert.equal(translations.de.contact.location, 'Costa del Sol, Spanien');
  assert.equal(translations.es.footer.call, 'Llamada');
  assert.equal(translations.es.footer.message, 'Mensaje');
  const combinedArea = /Málaga(?: Capital| Stadt)?\s+(?:y|and|und an der|&(?:amp;)?)\s+Costa del Sol/i;
  for (const lang of ['es', 'en', 'de']) {
    assert.doesNotMatch(JSON.stringify(translations[lang]), combinedArea, lang);
  }
  for (const page of pages) {
    const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
    assert.doesNotMatch(html, combinedArea, page);
    assert.ok(html.includes('<span id="contact-location-display">Costa del Sol, España</span>'));
    if (page === 'contacto.html') {
      assert.ok(html.includes('<div class="channel-val contact-location-val">Costa del Sol, España</div>'));
    }
  }
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.doesNotMatch(main, combinedArea, 'Legal copy');
});

test('Navbar uses concise independent area labels in all three languages', () => {
  assert.deepEqual(translations.es.nav, { home: 'Inicio', about: 'Sobre Mí', services: 'Servicios', allServices: 'Servicios de Asesoramiento', locations: 'Zonas', contact: 'Contacto', cta: 'Agendar Cita', ayuda: '¿Como puedo ayudarte?' });
  assert.deepEqual(translations.en.nav, { home: 'Home', about: 'About Me', services: 'Services', allServices: 'Advisory Services', locations: 'Areas', contact: 'Contact', cta: 'Book Consultation', ayuda: 'How can I help you?' });
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

test('zonas.html: client introduction, seven local descriptions and closing advice', async () => {
  const html = await readFile(new URL('../zonas.html', import.meta.url), 'utf8');
  const coast = translations.es.coast;
  assert.equal(coast.kicker, 'COSTA DEL SOL');
  const intro = html.match(/<section class="coast-intro">[\s\S]*?<\/section>/)[0];
  assert.ok(!intro.includes('MÁLAGA') && !intro.includes('<em '));
  assert.match(intro, /<h1><span data-i18n="coast.title">Un lugar para vivir\.<\/span><br \/><span data-i18n="coast.titleAccent">Una forma de sentir\.<\/span><\/h1>/);
  assert.equal(coast.galleryKicker, 'Una mirada local');
  assert.match(html, /<h2 id="coast-gallery-title" data-i18n="coast.galleryKicker">Una mirada local<\/h2><p class="section-subtitle-clean" data-i18n="coast.galleryTitle">Encuentra tu lugar en la costa\.<\/p>/);
  assert.ok(!html.includes('DE ESTE A OESTE'));
  assert.equal(coast.guidanceKicker, 'El lugar importa. Tu estilo de vida, más.');
  assert.equal(coast.intro, 'Vivir cerca de la playa está bien, pero también importa tener a mano tiendas, restaurantes y los servicios que tú necesitas. Explora estas zonas y cuéntame qué te gustaría tener cerca de tu próxima casa.');
  assert.equal(coast.guidanceTitle, 'Conocer la costa es una cosa. Vivir aquí es otra.');
  assert.equal(coast.guidanceDescription, 'Puedes preguntarle a ChatGPT por el clima, las playas o los mejores restaurantes. Pero para elegir dónde vivir, también necesitas conocer lo que pasa en cada barrio, cómo cambia en verano y cómo sería tu día a día allí.');
  assert.equal(coast.guidanceFollowup, 'Cuéntame qué estilo de vida buscas y, como asesor local, te ayudo a encontrar la zona que encaja contigo.');
  for (const [slug, features] of Object.entries({
    malaga: ['La Alcazaba', 'el Teatro Romano', 'Muelle Uno'],
    torremolinos: ['Aqualand', 'Jardín Botánico Molino de Inca', 'Miguel Ángel Jiménez'],
    benalmadena: ['Parque de la Paloma', 'teleférico', 'acuario'],
    fuengirola: ['mercados', 'Bioparc', 'Castillo Sohail'],
    mijas: ['pueblo blanco en la sierra', 'senda litoral', 'golf'],
    marbella: ['casco antiguo', 'clubes de playa', 'piscinas privadas o comunitarias'],
    estepona: ['calles blancas y flores', 'campos de golf', 'dependen de cada complejo'],
  })) {
    for (const feature of features) assert.ok(coast[slug].description.includes(feature), `${slug}: ${feature}`);
    assert.ok(html.includes(`data-i18n="coast.${slug}.description"`));
  }
  const keys = [...html.matchAll(/<([a-z][\w-]*)\b[^>]*data-i18n="(coast\.(?:kicker|title|titleAccent|intro|galleryKicker|galleryTitle|guidanceKicker|guidanceTitle|guidanceQuestion|guidanceDescription|guidanceFollowup|guidanceCta|\w+\.description))"[^>]*>([^<]*)<\/\1>/g)];
  assert.equal(keys.length, 19);
  for (const [, , key, text] of keys) {
    assert.equal(text.trim(), resolveKey(translations.es, key), `${key}: Spanish fallback`);
    for (const lang of ['es', 'en', 'de']) assert.ok(resolveKey(translations[lang], key)?.trim(), `${lang}: ${key}`);
  }
  const closing = html.match(/<section class="coast-guidance"[\s\S]*?<\/section>/)[0];
  assert.match(closing, /<span class="coast-guidance-label" data-i18n="coast.guidanceKicker">El lugar importa\. Tu estilo de vida, más\.<\/span>\s*<h2 id="coast-guidance-title" data-i18n="coast.guidanceQuestion">¿Cómo te gustaría vivir aquí\?<\/h2>/);
  assert.match(closing, /<h3 class="coast-guidance-context" data-i18n="coast.guidanceTitle">[^<]+<\/h3>\s*<p data-i18n="coast.guidanceDescription">/);
  assert.equal([...closing.matchAll(/<p\b/g)].length, 2);
  assert.ok(closing.indexOf('coast.guidanceFollowup') < closing.indexOf('<a href="/contacto.html#form"'));
  assert.ok(closing.includes('href="/contacto.html#form"'));
  assert.equal(coast.guidanceQuestion, '¿Cómo te gustaría vivir aquí?');
  assert.equal(coast.guidanceCta, 'Encontrar mi zona contigo');
});

test('Four advisory actions link to the correct inquiry context', async () => {
  const html = await readFile(new URL('../servicios.html', import.meta.url), 'utf8');
  assert.equal([...html.matchAll(/class="advisory-action"/g)].length, 4);
  const hero = html.match(/<section class="page-hero-banner-clean">[\s\S]*?<\/section>/)[0];
  assert.ok(!hero.includes('<p ') && !hero.includes('serviceActions.intro'), 'The services title has no introductory phrase');
  const intro = html.match(/<div class="advisory-actions-intro">[\s\S]*?<\/div>/)[0];
  assert.match(intro, /<h2 id="advisory-actions-title">Humberto Machacón<\/h2>\s*<p data-i18n="serviceActions.advisorRole">Asesor inmobiliario<\/p>/);
  assert.ok(!intro.includes('serviceActions.title') && !intro.includes('serviceActions.description'));
  const actions = [...html.matchAll(/<a\b[^>]*class="advisory-action"[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0]);
  assert.deepEqual(actions.map(action => action.match(/data-service="([^"]+)"/)[1]), ['vender', 'comprar', 'invertir', 'valorar']);
  for (const [index, [key, title]] of Object.entries({ sell: 'Vender', buy: 'Comprar', invest: 'Invertir', value: 'Valorar' }).entries()) {
    assert.ok(actions[index].includes(`<h3 data-i18n="serviceActions.pageTitles.${key}">${title}</h3>`));
    assert.ok(!actions[index].includes('advisory-action-category'), 'Each service has a single prominent title');
  }
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

test('servicios.html: client descriptions, four methodology steps and three complete FAQs', async () => {
  const html = await readFile(new URL('../servicios.html', import.meta.url), 'utf8');
  const descriptions = {
    sell: '¿Quieres vender, pero no sabes en quién confiar? ¿O ya has publicado tu casa y solo recibes llamadas de agencias? Cuéntame qué está pasando y vemos juntos por dónde empezar.',
    buy: '¿Llevas tiempo buscando y no encuentras lo que necesitas, o no sabes si el precio es correcto? Cuéntame qué te está costando encontrar y buscamos juntos.',
    invest: 'Dime en qué quieres invertir y así analizaremos las opciones según tus objetivos, teniendo en cuenta los gastos, los riesgos y la rentabilidad que buscas.',
    value: 'Te ayudo a conocer el valor de tu propiedad según sus características y el mercado de tu zona, para que decidas con una base clara.',
  };
  assert.deepEqual(translations.es.serviceActions.pageDescriptions, descriptions);
  for (const key of Object.keys(descriptions)) {
    assert.ok(html.includes(`data-i18n="serviceActions.pageDescriptions.${key}"`));
  }
  assert.deepEqual([1, 2, 3, 4].map(step => translations.es.method[`step${step}`]), ['Escuchándote', 'Entendiéndote', 'Orientándote', 'Actuando']);
  const cards = [...html.matchAll(/<div class="service-clean-card">[\s\S]*?<\/p>\s*<\/div>/g)];
  assert.equal(cards.length, 4);
  cards.forEach(([card], index) => {
    const step = index + 1;
    assert.ok(card.includes(`<div class="service-number">0${step}</div>`));
    assert.ok(card.includes(`data-i18n="method.step${step}"`));
    assert.ok(card.includes(`data-i18n="method.desc${step}"`));
  });
  const questions = [
    '¿Cómo sé si estoy pagando de más?',
    '¿Por qué mi casa no se vende si otras se anuncian al mismo precio?',
    '¿Es buen momento para comprar o vender, o me conviene esperar?',
  ];
  const faqs = [...html.matchAll(/<details>([\s\S]*?)<\/details>/g)];
  assert.equal(faqs.length, 3);
  faqs.forEach(([faq], index) => {
    const number = index + 1;
    assert.equal(translations.es.faq[`q${number}`], questions[index]);
    assert.ok(faq.includes(`data-i18n="faq.q${number}"`));
    assert.ok(faq.includes(`data-i18n="faq.a${number}"`));
    assert.ok(faq.includes(`data-i18n="faq.a${number}Followup"`));
    assert.equal([...faq.matchAll(/<p\b/g)].length, 2, 'Each complete answer preserves its paragraph break');
  });
  for (const match of html.matchAll(/<([a-z][\w-]*)\b[^>]*\bdata-i18n="((?:serviceActions\.pageDescriptions\.|method\.(?:step|desc)|faq\.)[^"]*)"[^>]*>([^<]*)<\/\1>/g)) {
    assert.equal(match[3].trim(), resolveKey(translations.es, match[2]), `${match[2]}: Spanish fallback`);
    for (const lang of ['es', 'en', 'de']) {
      assert.ok(resolveKey(translations[lang], match[2])?.trim(), `${lang}: ${match[2]}`);
    }
  }
});

test('contacto.html: personal plan introduction and prominent direct-contact heading', async () => {
  const html = await readFile(new URL('../contacto.html', import.meta.url), 'utf8');
  const copy = {
    title: 'Hablemos de tu plan',
    subtitle: 'Quizá quieres comprar, vender o simplemente saber qué opciones tienes. No necesitas tenerlo todo claro: cuéntame en qué punto estás y vemos juntos cómo dar el siguiente paso.',
    channels: 'Trato directo',
    personalTitle: 'Cuéntame, te escucho.',
    personalDesc: 'No hace falta que sepas por dónde empezar. Dime qué estás pensando o qué te preocupa y lo hablamos con calma.',
  };
  for (const [key, text] of Object.entries(copy)) {
    assert.equal(translations.es.contact[key], text);
    assert.ok(html.includes(`data-i18n="contact.${key}"`));
    assert.ok(html.includes(text), `${key}: Spanish fallback`);
    for (const lang of ['es', 'en', 'de']) assert.ok(translations[lang].contact[key]?.trim());
  }
  assert.match(html, /<h1 class="section-title" id="contact-page-title" data-i18n="contact.title">Hablemos de tu plan<\/h1>/);
  assert.match(html, /<h2 class="section-title" data-i18n="contact.channels">Trato directo<\/h2>\s*<p class="contact-personal-subtitle" id="contact-project-title" data-i18n="contact.personalTitle">Cuéntame, te escucho\.<\/p>\s*<p[^>]*id="contact-project-description"/);
  assert.ok(html.includes('data-i18n="contact.formHint"'));
  assert.ok(html.includes('data-i18n="contact.formSubmit"'));
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
