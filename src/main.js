import './style.css';
import './editorial.css';
import { translations } from './translations.js';
import { siteConfig } from './config.js';
import { initAmbientVideos } from './media.js';
import { coastalAreas, initCoastGallery } from './coast.js';
import { contactInterests, getServiceKey, projectFields, getProjectLines } from './advisory.js';

// Application State
let currentLang = 'es';
try {
  const saved = localStorage.getItem('hm_advisor_lang');
  if (saved && translations[saved]) currentLang = saved;
} catch { /* The site also works when browser storage is unavailable. */ }

/**
 * Helper to resolve nested object keys by string path (e.g. 'hero.titleStart')
 */
function getTranslation(obj, path) {
  return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj);
}

/**
 * Updates all texts in the DOM according to current language
 */
function renderLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  try { localStorage.setItem('hm_advisor_lang', lang); } catch { /* Optional persistence. */ }
  document.documentElement.lang = lang;

  const t = translations[lang];
  if (!t) return;

  // 1. Update text content for elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = getTranslation(t, key);
    if (value) {
      el.textContent = value;
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const value = getTranslation(t, el.dataset.i18nPlaceholder);
    if (value) el.placeholder = value;
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    const value = getTranslation(t, el.dataset.i18nAriaLabel);
    if (value) el.setAttribute('aria-label', value);
  });

  // 2. Update Language Switcher Buttons
  document.querySelectorAll('.lang-btn[data-lang]').forEach((button) => {
    const active = button.dataset.lang === lang;
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('active', active);
  });
  document.getElementById('lang-switcher')?.setAttribute('aria-label', {
    es: 'Seleccionar idioma', en: 'Select language', de: 'Sprache auswählen',
  }[lang]);

  // 3. Update Service Points Lists (if on services page)
  ['s1', 's2', 's3', 's4'].forEach((serviceKey) => {
    const listEl = document.getElementById(`${serviceKey}-points`);
    const points = t.services && t.services[`${serviceKey}Points`];
    if (listEl && points) {
      listEl.innerHTML = points
        .map(
          (point) => `
          <li style="display:flex; align-items:center; gap:0.5rem; font-size:0.86rem; color:var(--text-muted); margin-bottom:0.4rem;">
            <span style="color:var(--accent-gold-dark);">—</span>
            <span>${point}</span>
          </li>`
        )
        .join('');
    }
  });

  // 4. Update Contact Form Interest Select Options
  const interestSelect = document.getElementById('form-interest');
  if (interestSelect && t.contact && t.contact.interestOptions) {
    const selectedIndex = interestSelect.selectedIndex;
    interestSelect.replaceChildren(...t.contact.interestOptions.map((opt, index) => new Option(opt, contactInterests[index])));
    interestSelect.selectedIndex = Math.max(0, selectedIndex);
    syncContactProject();
  }

  // 5. Update Advisor Role and Affiliation if element present
  const roleEl = document.getElementById('advisor-badge-role');
  if (roleEl) {
    roleEl.textContent = siteConfig.advisor.title[lang] || siteConfig.advisor.title.es;
  }

  // 6. Update WhatsApp URLs with localized greeting
  updateWhatsAppLinks(lang);
  const callLink = document.getElementById('header-call-link');
  if (callLink) {
    callLink.setAttribute('aria-label', t.ui.callAdvisor);
    callLink.title = `${t.ui.callAdvisor} · ${siteConfig.contact.phoneDisplay}`;
  }
  const hamburger = document.getElementById('hamburger-btn');
  if (hamburger) hamburger.setAttribute('aria-label', t.ui[document.getElementById('nav-menu')?.classList.contains('open') ? 'closeMenu' : 'openMenu']);
  document.dispatchEvent(new Event('languagechange'));
}

/**
 * Builds direct WhatsApp click-to-chat links with localized message
 */
function updateWhatsAppLinks(lang) {
  const number = siteConfig.contact.whatsappNumber;
  const greeting = encodeURIComponent({
    es: 'Hola Humberto, me gustaría conversar contigo sobre tu asesoría inmobiliaria en Málaga. ¿Podemos hablar de mi proyecto?',
    en: 'Hello Humberto, I would like to discuss your real estate advisory in Malaga. Can we talk about my project?',
    de: 'Hallo Humberto, ich würde gerne mit dir über deine Immobilienberatung in Málaga sprechen. Können wir über mein Projekt sprechen?',
  }[lang]);

  const waUrl = `https://wa.me/${number}?text=${greeting}`;
  const callRequest = encodeURIComponent(translations[lang].footer.callMessage);
  document.querySelectorAll('.footer-call-link').forEach((link) => {
    link.href = `https://wa.me/${number}?text=${callRequest}`;
  });

  const directBtns = document.querySelectorAll('.whatsapp-direct-link, #whatsapp-direct-link');
  directBtns.forEach((btn) => {
    btn.href = waUrl;
  });

  const floatingBtn = document.getElementById('floating-whatsapp');
  if (floatingBtn) floatingBtn.href = waUrl;

}

/**
 * Injects contact numbers and addresses from siteConfig
 */
function initSiteConfig() {
  const callLink = document.getElementById('header-call-link');
  if (callLink) callLink.href = `tel:+${siteConfig.contact.whatsappNumber}`;
  document.querySelectorAll('[data-social]').forEach((link) => {
    const url = siteConfig.socials[link.dataset.social];
    if (url) link.href = url;
  });
  // Bind repeated content outside the navbar without changing navigation options.
  document.querySelectorAll('.service-clean-link').forEach((el) => {
    el.dataset.i18n = el.getAttribute('href') === '/contacto.html' ? 'ui.consultation' : 'ui.discoverService';
  });
  document.querySelectorAll('.destination-explore').forEach((el) => { el.dataset.i18n = 'ui.exploreArea'; });
  document.querySelectorAll('.property-action-link').forEach((el) => { el.dataset.i18n = 'ui.areaAdvice'; });
  document.querySelectorAll('.consultation-advisor-role').forEach((el) => { el.dataset.i18n = 'ui.advisorTitle'; });
  document.querySelectorAll('.property-tag-badge').forEach((el, index) => {
    el.dataset.i18n = `locations.zone${index + 1}Tag`;
  });
  document.querySelectorAll('#contact-location-display, .contact-location-val').forEach((el) => {
    el.dataset.i18n = 'contact.location';
  });
  const phoneDisplays = document.querySelectorAll('#contact-phone-display, .contact-phone-val');
  phoneDisplays.forEach((el) => {
    el.textContent = siteConfig.contact.phoneDisplay;
    if (el.tagName === 'A') el.href = `tel:+${siteConfig.contact.whatsappNumber}`;
  });

  const emailDisplays = document.querySelectorAll('#contact-email-display, .contact-email-val');
  emailDisplays.forEach((el) => {
    el.textContent = siteConfig.contact.email;
    if (el.tagName === 'A') el.href = `mailto:${siteConfig.contact.email}`;
  });

  document.querySelectorAll('#contact-location-display, .contact-location-val').forEach((el) => {
    el.textContent = siteConfig.advisor.location;
  });

  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/**
 * Scroll behavior for Sticky Glass Header
 */
function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const handleScroll = () => {
    if (!document.querySelector('.hero-section') || window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/**
 * Mobile hamburger navigation
 */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-menu');

  if (hamburger && navMenu) {
    hamburger.setAttribute('aria-controls', 'nav-menu');
    hamburger.setAttribute('aria-expanded', 'false');
    const setOpen = (open) => {
      navMenu.classList.toggle('open', open);
      hamburger.textContent = open ? '✕' : '☰';
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.setAttribute('aria-label', translations[currentLang].ui[open ? 'closeMenu' : 'openMenu']);
    };
    hamburger.addEventListener('click', () => {
      setOpen(!navMenu.classList.contains('open'));
    });

    navMenu.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        setOpen(false);
      });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navMenu.classList.contains('open')) {
        setOpen(false);
        hamburger.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (!navMenu.contains(event.target) && !hamburger.contains(event.target)) setOpen(false);
    });
    window.matchMedia('(max-width: 1100px)').addEventListener('change', () => setOpen(false));
  }
}

/**
 * Contact Form submission handler
 */
function syncContactProject() {
  const select = document.getElementById('form-interest');
  if (!select) return;
  const service = select.dataset.projectContext === 'true' ? select.value : null;
  const key = getServiceKey(service);
  document.body.classList.toggle('contact-project-page', Boolean(key));
  const textBindings = {
    'contact-page-title': key ? `serviceActions.${key}.label` : 'contact.title',
    'contact-project-title': key ? `serviceActions.${key}.formTitle` : 'contact.personalTitle',
    'contact-project-description': key ? `serviceActions.${key}.formDescription` : 'contact.personalDesc',
  };
  for (const [id, path] of Object.entries(textBindings)) {
    const element = document.getElementById(id);
    if (element) {
      element.dataset.i18n = path;
      element.textContent = getTranslation(translations[currentLang], path);
    }
  }
  const fieldset = document.getElementById('project-fields');
  if (fieldset) {
    fieldset.hidden = !key;
    fieldset.disabled = !key;
    for (const field of projectFields) {
      const input = fieldset.elements.namedItem(field.name);
      if (!input) continue;
      const visible = field.services.includes(service);
      input.disabled = !visible;
      input.closest('.form-clean-group').hidden = !visible;
    }
  }
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  const statusAlert = document.getElementById('form-status-alert');
  if (!form) return;

  const interestSelect = document.getElementById('form-interest');
  const requestedService = new URLSearchParams(window.location.search).get('servicio');
  const requestedArea = new URLSearchParams(window.location.search).get('zona');
  const projectLocation = form.elements.namedItem('projectLocation');
  if (projectLocation && Object.hasOwn(coastalAreas, requestedArea)) {
    projectLocation.value = coastalAreas[requestedArea];
  }
  if (interestSelect) {
    if (getServiceKey(requestedService)) {
      interestSelect.value = requestedService;
      interestSelect.dataset.projectContext = 'true';
    }
    interestSelect.addEventListener('change', () => {
      interestSelect.dataset.projectContext = 'true';
      syncContactProject();
    });
    syncContactProject();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const labels = translations[currentLang].contact;
    const subject = `${{ es: 'Consulta de asesoría', en: 'Advisory inquiry', de: 'Beratungsanfrage' }[currentLang]} — ${data.get('name')}`;
    const body = [
      `${labels.formName}: ${data.get('name')}`,
      `${labels.formEmail}: ${data.get('email')}`,
      `${labels.formPhone}: ${data.get('phone') || '—'}`,
      `${labels.formInterest}: ${labels.interestOptions[contactInterests.indexOf(data.get('interest'))] || '—'}`,
      ...getProjectLines(data, labels, data.get('interest')),
      '', String(data.get('message')),
    ].join('\n');
    if (statusAlert) {
      statusAlert.className = 'form-status-alert success';
      const title = document.createElement('strong');
      title.dataset.i18n = 'contact.successTitle';
      title.textContent = labels.successTitle;
      const description = document.createElement('p');
      description.dataset.i18n = 'contact.successDesc';
      description.textContent = labels.successDesc;
      statusAlert.replaceChildren(title, description);
    }
    // No backend is configured: be transparent, and keep all fields for retry/copy.
    window.location.href = `mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

/**
 * Legal Modals
 */
function initLegalModals() {
  const backdrop = document.getElementById('legal-modal-backdrop');
  const title = document.getElementById('legal-modal-title');
  const body = document.getElementById('legal-modal-body');
  const closeBtn = document.getElementById('legal-modal-close');

  const legalContent = {
    aviso: {
      es: {
        title: 'Aviso Legal e Información Corporativa',
        body: `
          <h4>1. Identificación</h4>
          <p>En cumplimiento de la Ley 34/2002 (LSSI-CE), se informa que este sitio web constituye la marca personal y presentación profesional de <strong>Humberto Machacón</strong>, Asesor Inmobiliario operando en Málaga y Costa del Sol, España.</p>
          <h4>2. Objeto</h4>
          <p>La web tiene un carácter exclusivamente informativo y de asesoramiento personal independiente.</p>
          <h4>3. Propiedad Intelectual</h4>
          <p>Todos los textos, logotipos y elementos audiovisuales son propiedad de Humberto Machacón o cuentan con licencia de uso.</p>
        `,
      },
      en: {
        title: 'Legal Notice',
        body: `
          <h4>1. Identification</h4>
          <p>In accordance with Spanish Law 34/2002 (LSSI-CE), this website represents the personal brand and advisory practice of <strong>Humberto Machacón</strong>, Senior Real Estate Advisor based in Málaga and Costa del Sol, Spain.</p>
          <h4>2. Scope</h4>
          <p>This website serves solely for professional presentation and bespoke real estate advisory.</p>
          <h4>3. Intellectual Property</h4>
          <p>All editorial texts, branding visuals, and layout designs belong to Humberto Machacón or are utilized under valid license.</p>
        `,
      },
      de: {
        title: 'Rechtliche Hinweise',
        body: `
          <h4>1. Identifikation</h4>
          <p>Gemäß dem spanischen Gesetz 34/2002 (LSSI-CE) stellt diese Website die persönliche Marke und berufliche Tätigkeit von <strong>Humberto Machacón</strong>, Immobilienberater in Málaga und an der Costa del Sol, Spanien, vor.</p>
          <h4>2. Zweck</h4>
          <p>Diese Website dient ausschließlich der Information und der unabhängigen persönlichen Beratung.</p>
          <h4>3. Geistiges Eigentum</h4>
          <p>Alle Texte, Logos und audiovisuellen Elemente sind Eigentum von Humberto Machacón oder werden unter einer Nutzungslizenz verwendet.</p>
        `,
      },
    },
    privacidad: {
      es: {
        title: 'Política de Privacidad (RGPD)',
        body: `
          <h4>1. Responsable</h4>
          <p>El responsable del tratamiento de los datos es Humberto Machacón.</p>
          <h4>2. Finalidad</h4>
           <p>El formulario prepara un correo en su aplicación local. Esta web no almacena ni envía su consulta automáticamente. Si decide enviarla por correo o WhatsApp, sus datos se utilizarán para responder a su solicitud de asesoría.</p>
          <h4>3. Derechos</h4>
          <p>Puede ejercitar sus derechos de acceso, rectificación o cancelación enviando un correo a ${siteConfig.contact.email}.</p>
        `,
      },
      en: {
        title: 'Privacy Policy (GDPR)',
        body: `
          <h4>1. Controller</h4>
          <p>The party responsible for data is Humberto Machacón, Personal Real Estate Advisor.</p>
          <h4>2. Purpose</h4>
           <p>The form prepares a message in your local email application. This website does not store or automatically send your inquiry. If you send it via email or WhatsApp, your details will be used to respond to your advisory request.</p>
          <h4>3. Rights</h4>
          <p>You may exercise rights to access or erasure at any time by contacting ${siteConfig.contact.email}.</p>
        `,
      },
      de: {
        title: 'Datenschutzerklärung (DSGVO)',
        body: `
          <h4>1. Verantwortlicher</h4>
          <p>Verantwortlich für die Verarbeitung der Daten ist Humberto Machacón.</p>
          <h4>2. Zweck</h4>
          <p>Das Formular bereitet eine Nachricht in deinem lokalen E-Mail-Programm vor. Diese Website speichert deine Anfrage nicht und versendet sie nicht automatisch. Wenn du sie per E-Mail oder WhatsApp sendest, werden deine Daten zur Beantwortung deiner Beratungsanfrage verwendet.</p>
          <h4>3. Rechte</h4>
          <p>Du kannst deine Rechte auf Auskunft, Berichtigung oder Löschung per E-Mail an ${siteConfig.contact.email} ausüben.</p>
        `,
      },
    },
    cookies: {
      es: {
        title: 'Política de Cookies',
        body: `
          <h4>Uso de Cookies</h4>
           <p>Guardamos su idioma preferido en el almacenamiento local del navegador (localStorage), no en una cookie. Este sitio no incorpora analítica ni vídeos embebidos de terceros. Las fuentes tipográficas se solicitan a Google Fonts.</p>
        `,
      },
      en: {
        title: 'Cookies Policy',
        body: `
          <h4>Use of Cookies</h4>
           <p>Your language preference is stored in your browser's localStorage, not in a cookie. This site does not embed third-party videos or analytics. Typefaces are requested from Google Fonts.</p>
        `,
      },
      de: {
        title: 'Cookie-Hinweise',
        body: `
          <h4>Verwendung von Cookies</h4>
          <p>Deine Sprachpräferenz wird im localStorage deines Browsers gespeichert, nicht in einem Cookie. Diese Website verwendet keine Analyse-Tools oder eingebetteten Videos von Drittanbietern. Schriftarten werden von Google Fonts geladen.</p>
        `,
      },
    },
  };

  let previousFocus;
  function openModal(type) {
    if (!backdrop || !title || !body) return;
    const item = legalContent[type][currentLang];
    if (!item) return;
    title.textContent = item.title;
    body.innerHTML = item.body;
    previousFocus = document.activeElement;
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-labelledby', 'legal-modal-title');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  }

  function closeModal() {
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
    previousFocus?.focus();
  }

  document.getElementById('legal-btn-aviso')?.addEventListener('click', () => openModal('aviso'));
  document.getElementById('legal-btn-privacidad')?.addEventListener('click', () => openModal('privacidad'));
  document.getElementById('legal-btn-cookies')?.addEventListener('click', () => openModal('cookies'));

  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
  backdrop?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
    if (event.key === 'Tab') {
      const focusable = [...backdrop.querySelectorAll('button, a[href], input, [tabindex="0"]')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
}

/**
 * Language switcher click listeners
 */
function initLanguageSwitcher() {
  document.querySelectorAll('.lang-btn[data-lang]').forEach((button) => {
    button.addEventListener('click', () => renderLanguage(button.dataset.lang));
  });
}

/**
 * Automatically sets active state on current page nav link
 */
function initActiveNav() {
  const currentPath = window.location.pathname.toLowerCase();
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach((link) => {
    const href = link.getAttribute('href')?.toLowerCase() || '';
    const cleanHref = href.replace('.html', '').replace('/', '');

    if (cleanHref && currentPath.includes(cleanHref)) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });

}

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
  initSiteConfig();
  renderLanguage(currentLang);
  initActiveNav();
  initHeaderScroll();
  initMobileMenu();
  initAmbientVideos(() => translations[currentLang].ui);
  initCoastGallery();
  initContactForm();
  initLegalModals();
  initLanguageSwitcher();
});
