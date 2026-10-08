import './style.css';
import { translations } from './translations.js';
import { siteConfig } from './config.js';

// Application State
let currentLang = localStorage.getItem('hm_advisor_lang') || 'es';

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
  currentLang = lang;
  localStorage.setItem('hm_advisor_lang', lang);
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

  // 2. Update Language Switcher Buttons
  const esBtn = document.getElementById('lang-btn-es');
  const enBtn = document.getElementById('lang-btn-en');
  if (esBtn && enBtn) {
    if (lang === 'es') {
      esBtn.classList.add('active');
      enBtn.classList.remove('active');
    } else {
      enBtn.classList.add('active');
      esBtn.classList.remove('active');
    }
  }

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
    interestSelect.innerHTML = t.contact.interestOptions
      .map((opt) => `<option value="${opt}">${opt}</option>`)
      .join('');
  }

  // 5. Update Advisor Role and Affiliation if element present
  const roleEl = document.getElementById('advisor-badge-role');
  if (roleEl) {
    roleEl.textContent = siteConfig.advisor.title[lang] || siteConfig.advisor.title.es;
  }

  // 6. Update WhatsApp URLs with localized greeting
  updateWhatsAppLinks(lang);
}

/**
 * Builds direct WhatsApp click-to-chat links with localized message
 */
function updateWhatsAppLinks(lang) {
  const number = siteConfig.contact.whatsappNumber;
  const greeting =
    lang === 'es'
      ? encodeURIComponent('Hola Humberto, me gustaría solicitar una consulta privada sobre propiedades en Málaga.')
      : encodeURIComponent('Hello Humberto, I would like to schedule a private advisory consultation regarding properties in Malaga.');

  const waUrl = `https://wa.me/${number}?text=${greeting}`;

  const directBtns = document.querySelectorAll('.whatsapp-direct-link, #whatsapp-direct-link');
  directBtns.forEach((btn) => {
    btn.href = waUrl;
  });

  const floatingBtn = document.getElementById('floating-whatsapp');
  if (floatingBtn) floatingBtn.href = waUrl;

  // Property consultation links
  document.querySelectorAll('.property-whatsapp-btn').forEach((btn) => {
    const propTitle = btn.getAttribute('data-prop-name') || 'Málaga';
    const propMsg =
      lang === 'es'
        ? encodeURIComponent(`Hola Humberto, me gustaría recibir más información y el dossier privado de la propiedad: ${propTitle}`)
        : encodeURIComponent(`Hello Humberto, I would like to receive the private dossier for the property: ${propTitle}`);
    btn.href = `https://wa.me/${number}?text=${propMsg}`;
  });
}

/**
 * Injects contact numbers and addresses from siteConfig
 */
function initSiteConfig() {
  const phoneDisplays = document.querySelectorAll('#contact-phone-display, .contact-phone-val');
  phoneDisplays.forEach((el) => {
    el.textContent = siteConfig.contact.phoneDisplay;
  });

  const emailDisplays = document.querySelectorAll('#contact-email-display, .contact-email-val');
  emailDisplays.forEach((el) => {
    el.textContent = siteConfig.contact.email;
  });

  const locationDisplay = document.getElementById('contact-location-display');
  if (locationDisplay) locationDisplay.textContent = siteConfig.advisor.location;

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
    if (window.scrollY > 40) {
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
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      hamburger.textContent = navMenu.classList.contains('open') ? '✕' : '☰';
    });

    navMenu.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        hamburger.textContent = '☰';
      });
    });
  }
}

/**
 * Property filter tabs on homepage
 */
function initPropertyFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const propertyCards = document.querySelectorAll('.property-card');

  if (!filterBtns.length || !propertyCards.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filterType = btn.getAttribute('data-filter');

      propertyCards.forEach((card) => {
        const category = card.getAttribute('data-category');
        if (filterType === 'all' || category === filterType) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.opacity = '1';
          }, 50);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/**
 * Contact Form submission handler
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const statusAlert = document.getElementById('form-status-alert');
  const submitBtn = document.getElementById('form-btn-submit');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const t = translations[currentLang];
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = t.contact.sending;
    }

    setTimeout(() => {
      if (statusAlert) {
        statusAlert.className = 'form-status-alert success';
        statusAlert.innerHTML = `
          <strong>${t.contact.successTitle}</strong><br />
          ${t.contact.successDesc}
        `;
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = t.contact.formSubmit;
      }
      form.reset();

      setTimeout(() => {
        if (statusAlert) statusAlert.style.display = 'none';
      }, 7000);
    }, 700);
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
    },
    privacidad: {
      es: {
        title: 'Política de Privacidad (RGPD)',
        body: `
          <h4>1. Responsable</h4>
          <p>El responsable del tratamiento de los datos es Humberto Machacón.</p>
          <h4>2. Finalidad</h4>
          <p>Los datos aportados se utilizan únicamente para responder a su solicitud de consulta o información sobre propiedades.</p>
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
          <p>Your details are processed solely to respond to advisory inquiries and property requests.</p>
          <h4>3. Rights</h4>
          <p>You may exercise rights to access or erasure at any time by contacting ${siteConfig.contact.email}.</p>
        `,
      },
    },
    cookies: {
      es: {
        title: 'Política de Cookies',
        body: `
          <h4>Uso de Cookies</h4>
          <p>Utilizamos cookies técnicas necesarias para recordar su idioma preferido (español o inglés). No utilizamos cookies invasivas de terceros.</p>
        `,
      },
      en: {
        title: 'Cookies Policy',
        body: `
          <h4>Use of Cookies</h4>
          <p>We use essential technical cookies to remember your language preference (Spanish or English). No invasive third-party tracking is used.</p>
        `,
      },
    },
  };

  function openModal(type) {
    if (!backdrop || !title || !body) return;
    const item = legalContent[type][currentLang];
    if (!item) return;
    title.textContent = item.title;
    body.innerHTML = item.body;
    backdrop.classList.add('open');
  }

  function closeModal() {
    if (backdrop) backdrop.classList.remove('open');
  }

  document.getElementById('legal-btn-aviso')?.addEventListener('click', () => openModal('aviso'));
  document.getElementById('legal-btn-privacidad')?.addEventListener('click', () => openModal('privacidad'));
  document.getElementById('legal-btn-cookies')?.addEventListener('click', () => openModal('cookies'));

  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
}

/**
 * Language switcher click listeners
 */
function initLanguageSwitcher() {
  document.getElementById('lang-btn-es')?.addEventListener('click', () => renderLanguage('es'));
  document.getElementById('lang-btn-en')?.addEventListener('click', () => renderLanguage('en'));
}

/**
 * Automatically sets active state on current page nav link
 */
function initActiveNav() {
  const currentPath = window.location.pathname.toLowerCase();
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach((link) => {
    const href = link.getAttribute('href').toLowerCase();
    const cleanHref = href.replace('.html', '').replace('/', '');

    if ((currentPath === '/' || currentPath.endsWith('index.html') || currentPath === '') && (href === '/' || href === '/index.html')) {
      link.classList.add('active');
    } else if (cleanHref && currentPath.includes(cleanHref)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
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
  initPropertyFilters();
  initContactForm();
  initLegalModals();
  initLanguageSwitcher();
});
