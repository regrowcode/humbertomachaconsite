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
      de: "Senior-Immobilienberater",
    },
    location: "Málaga & Costa del Sol, España",
    // Nombre de la agencia con la que colabora (puede cambiarse cuando lo deseen)
    partnerAgency: "Firma Inmobiliaria Colaboradora",
  },

  // Contacto directo
  contact: {
    // Número para WhatsApp internacional (sin +, sin espacios ni guiones)
    // Ejemplo: "34612345678"
    whatsappNumber: "34681816023",
    phoneDisplay: "+34 681 81 60 23",
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

  // Rutas de imágenes oficiales del cliente
  images: {
    portrait: "/images/humberto-suit-beige.webp",
    portraitBeige: "/images/humberto-suit-beige.webp",
    portraitNavy: "/images/humberto-suit-navy.webp",
    avatar: "/images/humberto-avatar.png",
    heroVilla: "/images/hero-villa.webp",
    malagaCentro: "/images/malaga-centro.webp",
    malagaCosta: "/images/malaga-costa.webp",
    logoUrl: null, // Si tiene isotipo o monograma, colocar en /public/images/logo.png
  },
};
