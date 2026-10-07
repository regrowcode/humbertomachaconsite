/**
 * CONFIGURACIÓN DEL ASESOR INMOBILIARIO
 * Aquí puedes cambiar fácilmente los datos de contacto, enlaces, imágenes y empresa colaboradora.
 */
export const siteConfig = {
  // Información personal y profesional
  advisor: {
    fullName: "Humberto Machacón",
    shortName: "Humberto",
    initials: "HM",
    title: {
      es: "Asesor Inmobiliario Senior",
      en: "Senior Real Estate Advisor",
    },
    location: "Málaga & Costa del Sol, España",
    // Nombre de la agencia con la que colabora (puede cambiarse cuando lo deseen)
    partnerAgency: "Firma Inmobiliaria Colaboradora",
  },

  // Contacto directo
  contact: {
    // Número para WhatsApp internacional (sin +, sin espacios ni guiones)
    // Ejemplo: "34612345678"
    whatsappNumber: "34600000000",
    phoneDisplay: "+34 600 000 000",
    email: "contacto@humbertomachacon.com",
    // Enlace opcional a Calendly para agendar videollamadas
    calendlyUrl: "https://calendly.com",
    address: "Paseo de Reding / Centro Histórico, Málaga, España",
    hours: "Lunes a Viernes: 09:00 - 19:30 CET",
  },

  // Redes sociales profesionales
  socials: {
    linkedin: "https://linkedin.com",
    instagram: "https://instagram.com",
    whatsapp: "https://wa.me/34600000000",
  },

  // Rutas de imágenes (puedes reemplazar los archivos en /public/images/ o cambiar las rutas aquí)
  images: {
    portrait: "/images/humberto-machacon.jpg",
    heroVilla: "/images/hero-villa.jpg",
    malagaCentro: "/images/malaga-centro.jpg",
    malagaCosta: "/images/malaga-costa.jpg",
    // Si tu hermano tiene un archivo de logo, colócalo en /public/images/logo.png y descomenta:
    logoUrl: null, // Si es null, se genera el isotipo tipográfico 'HM | HUMBERTO MACHACÓN'
  },
};
