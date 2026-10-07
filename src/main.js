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

  // 3. Update Service Points Lists
  ['s1', 's2', 's3', 's4'].forEach((serviceKey) => {
    const listEl = document.getElementById(`${serviceKey}-points`);
    const points = t.services[`${serviceKey}Points`];
    if (listEl && points) {
      listEl.innerHTML = points
        .map(
          (point) => `
          <li class="service-point">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>${point}</span>
          </li>`
        )
        .join('');
    }
  });

  // 4. Update Contact Form Interest Select Options
  const interestSelect = document.getElementById('form-interest');
  if (interestSelect && t.contact.interestOptions) {
    interestSelect.innerHTML = t.contact.interestOptions
      .map((opt) => `<option value="${opt}">${opt}</option>`)
      .join('');
  }

  // 5. Update Advisor Role and Affiliation
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
      ? encodeURIComponent('Hola Humberto, me gustaría solicitar una consulta privada sobre el mercado inmobiliario en Málaga.')
      : encodeURIComponent('Hello Humberto, I would like to schedule a private advisory consultation regarding Malaga real estate.');

  const waUrl = `https://wa.me/${number}?text=${greeting}`;

  const directBtn = document.getElementById('whatsapp-direct-link');
  if (directBtn) directBtn.href = waUrl;

  const floatingBtn = document.getElementById('floating-whatsapp');
  if (floatingBtn) floatingBtn.href = waUrl;
}

/**
 * Injects contact numbers and addresses from siteConfig
 */
function initSiteConfig() {
  const phoneDisplay = document.getElementById('contact-phone-display');
  if (phoneDisplay) phoneDisplay.textContent = siteConfig.contact.phoneDisplay;

  const emailDisplay = document.getElementById('contact-email-display');
  if (emailDisplay) emailDisplay.textContent = siteConfig.contact.email;

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
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
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

    // Close when clicking nav links
    navMenu.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        hamburger.textContent = '☰';
      });
    });
  }
}

/**
 * FAQ Accordion logic
 */
function initFaqAccordion() {
  const accordion = document.getElementById('faq-accordion');
  if (!accordion) return;

  const items = accordion.querySelectorAll('.faq-item');
  items.forEach((item) => {
    const btn = item.querySelector('.faq-question-btn');
    btn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      items.forEach((i) => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
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
    submitBtn.disabled = true;
    submitBtn.textContent = t.contact.sending;

    // Simulate sending or send to Web3Forms / mailto
    setTimeout(() => {
      statusAlert.className = 'form-status-alert success';
      statusAlert.innerHTML = `
        <strong>${t.contact.successTitle}</strong><br />
        ${t.contact.successDesc}
      `;

      submitBtn.disabled = false;
      submitBtn.textContent = t.contact.formSubmit;
      form.reset();

      setTimeout(() => {
        statusAlert.style.display = 'none';
      }, 8000);
    }, 900);
  });
}

/**
 * Legal Modals (Aviso Legal, Política de Privacidad, Cookies)
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
          <h4>1. Identificación del Asesor</h4>
          <p>En cumplimiento de la Ley 34/2002 (LSSI-CE), se informa que este sitio web constituye la marca personal y presentación profesional de <strong>Humberto Machacón</strong>, Asesor Inmobiliario operando en Málaga y la Costa del Sol, España.</p>
          <h4>2. Objeto del Sitio Web</h4>
          <p>La presente web tiene un carácter estrictamente informativo y de asesoramiento personal. No constituye una plataforma de intermediación financiera directa ni venta directa de inmuebles por cuenta propia, actuando como consultor independiente en colaboración con firmas inmobiliarias colegiadas y autorizadas.</p>
          <h4>3. Propiedad Intelectual</h4>
          <p>Todos los textos, logotipos, elementos gráficos y composiciones audiovisuales son propiedad de Humberto Machacón o cuentan con licencias de uso correspondientes.</p>
        `,
      },
      en: {
        title: 'Legal Notice & Corporate Information',
        body: `
          <h4>1. Advisor Identification</h4>
          <p>In accordance with Spanish Law 34/2002 (LSSI-CE), this website represents the personal brand and advisory practice of <strong>Humberto Machacón</strong>, Senior Real Estate Advisor based in Málaga and Costa del Sol, Spain.</p>
          <h4>2. Purpose of the Website</h4>
          <p>This website serves solely for professional presentation and bespoke real estate advisory. It does not operate as an automated financial brokerage or self-owned sales vehicle, operating in strategic alliance with licensed Spanish real estate agencies.</p>
          <h4>3. Intellectual Property</h4>
          <p>All editorial texts, branding visuals, and layout designs belong to Humberto Machacón or are utilized under valid commercial rights.</p>
        `,
      },
    },
    privacidad: {
      es: {
        title: 'Política de Privacidad y Protección de Datos (RGPD)',
        body: `
          <h4>1. Responsable del Tratamiento</h4>
          <p>El responsable del tratamiento de los datos facilitados a través de los formularios o canales de contacto es Humberto Machacón.</p>
          <h4>2. Finalidad</h4>
          <p>La recogida y tratamiento de datos personales se limita exclusivamente a dar respuesta a sus solicitudes de información, coordinar visitas o agendar llamadas de asesoramiento personalizado.</p>
          <h4>3. Derechos del Usuario</h4>
          <p>Puede ejercer en cualquier momento sus derechos de acceso, rectificación, supresión y limitación de sus datos dirigiendo un correo a ${siteConfig.contact.email}.</p>
        `,
      },
      en: {
        title: 'Privacy Policy & Data Protection (GDPR)',
        body: `
          <h4>1. Data Controller</h4>
          <p>The party responsible for data submitted through this site is Humberto Machacón, Personal Real Estate Advisor.</p>
          <h4>2. Purpose of Processing</h4>
          <p>Your contact details are processed strictly to respond to advisory inquiries, arrange property previews, and establish confidential consulting sessions.</p>
          <h4>3. Your Rights</h4>
          <p>You may exercise your rights to access, amend, or erase your information at any time by emailing ${siteConfig.contact.email}.</p>
        `,
      },
    },
    cookies: {
      es: {
        title: 'Política de Cookies',
        body: `
          <h4>Uso Técnico y Analítico</h4>
          <p>Este sitio web utiliza cookies técnicas indispensables para recordar su preferencia de idioma (español o inglés) y garantizar una navegación segura y fluida. No se emplean cookies de rastreo invasivo ni venta de datos a terceros.</p>
        `,
      },
      en: {
        title: 'Cookies Policy',
        body: `
          <h4>Technical & Preference Cookies</h4>
          <p>This website uses essential technical cookies strictly to remember your language preference (Spanish or English) and provide smooth, secure navigation. No invasive tracking or commercial data reselling is conducted.</p>
        `,
      },
    },
  };

  function openModal(type) {
    const item = legalContent[type][currentLang];
    if (!item) return;
    title.textContent = item.title;
    body.innerHTML = item.body;
    backdrop.classList.add('open');
  }

  function closeModal() {
    backdrop.classList.remove('open');
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
  initFaqAccordion();
  initContactForm();
  initLegalModals();
  initLanguageSwitcher();
});

