# Análisis y renovación UI/UX

## Proyecto revisado

- Sitio estático multipágina: inicio, sobre mí, servicios, zonas y contacto.
- Vite 8, JavaScript sin framework, CSS compartido, despliegue previsto en Vercel.
- Contactos centralizados en `src/config.js`; textos ES/EN en `src/translations.js`.
- Revisados: las cinco páginas, configuración de compilación/despliegue,
  estilos, interacciones, traducciones, recursos públicos y documentación.
- No existía backend de contacto ni suite de pruebas.

## Hallazgos iniciales

- Vídeo de portada de 22,4 MB, precarga automática y sin control de pausa.
- Cabecera blanca sobre fondo claro en interiores antes del primer scroll.
- Traducciones ausentes y numerosos títulos y enlaces secundarios solo en español.
- Formulario que simulaba un envío exitoso sin transmitir ningún dato.
- IDs repetidos en contacto; enlaces de teléfono/correo no sincronizados con la configuración.
- Navegación móvil tardía para tablet, sin estado accesible ni cierre con Escape.
- Modales sin gestión de foco y movimiento sin adaptación a preferencias del usuario.
- Mensajes orientados a comercialización, cifras/testimonios sin documentación
  verificable y mención de Golden Visa que no conviene mantener como oferta actual.
- README con funcionalidades anunciadas que no estaban implementadas.
- Restos del scaffold de Vite (`src/counter.js`, `src/assets/`) sin uso por las páginas;
  conservados, sin borrar material previo.

## Dirección de diseño

Referencia consultada: https://kretzrealestate.com/es/

Se adapta su lenguaje editorial —imagen cinematográfica, serif amplia, blanco,
negro cálido, tonos suaves y botones rectangulares— sin copiar su marca ni material.
No se replica su catálogo: el producto de este sitio es el acompañamiento personal.

La nueva jerarquía: propuesta humana → quién es Humberto → cómo ayuda → escenas
de asesoría y estilo de vida → conocimiento local → método → conversación.

**Navbar:** se conservan textos, orden, enlaces, submenú, selector ES/EN y Agendar Cita.
Solo se corrigen contraste, adaptación a tablet y accesibilidad de la interacción.

## Implementación

- Capa visual compartida `src/editorial.css`, sobre el sistema base existente.
- Inicio renovado; retratos reales destacados y WebP optimizado.
- Servicios presentados como orientación, análisis y coordinación, sin garantizar resultados.
- Metodología en lugar de testimonios/cifras no verificados en la portada.
- FAQ nativa con teclado en servicios.
- Tres vídeos locales de ambiente con licencia comercial gratuita documentada en
  `public/videos/CREDITS.md`. No representan clientes reales ni ubicaciones concretas.
- Vídeos de 0,9–2,1 MB, carga al entrar en pantalla, pausa manual, pausa fuera de
  pantalla/pestaña y póster estático para movimiento reducido o ahorro de datos.
- Formulario transparente: prepara un correo mediante `mailto:`; no simula un envío.
  Los campos se conservan si el usuario no tiene una aplicación de correo configurada.
- Traducción del contenido nuevo y del contenido principal de todas las páginas.
- Enlaces de contacto sincronizados, landmarks y salto al contenido, foco en modales.
- `npm test`: comprobaciones de estructura, IDs, traducciones, navbar y recursos.

## Antes de publicar

1. Sustituir teléfono/WhatsApp de ejemplo `+34 600 000 000` en `src/config.js`
   y confirmar que el correo realmente existe. No se inventaron datos del asesor.
2. Incorporar trayectoria, credenciales y testimonios únicamente cuando sean verificables
   y cuenten con autorización. No se añadieron años de experiencia ni resultados inventados.
3. Verificar derechos de las imágenes y retratos preexistentes; este upgrade no acredita su origen.
4. Revisar textos legales con un profesional, incluyendo identificación completa del titular.
5. Si se necesita envío desde la web, integrar un backend o proveedor de formularios:
   actualmente el envío final depende de la aplicación de correo del visitante.
6. Sustituir stock por vídeo propio del asesor cuando esté disponible. Conservar licencia
   y consentimiento de las personas grabadas.

Los archivos originales se conservan para no descartar material del proyecto;
el vídeo antiguo no se reproduce. Google Fonts sigue siendo un servicio externo.

## Validación

- Compilación de producción con las cinco entradas de Vite.
- Siete pruebas automatizadas de estructura, traducciones, recursos y navbar.
- Navegación real en Chrome a 320, 375, 768, 1024 y 1440 px: sin desbordamiento horizontal.
- Comprobados ES/EN, selección conservada al cambiar idioma, FAQ, Escape, foco del
  modal, pausa de vídeo, carga diferida, movimiento reducido y almacenamiento bloqueado.
- Comparado el bloque HTML de cabecera de las cinco páginas con Git: intacto.
- Auditoría automatizada axe de contraste y reglas WCAG A/AA; complementa,
  pero no sustituye, una evaluación completa con personas y tecnologías de apoyo.
  Resultado: cero infracciones detectadas en las cinco páginas a 375 y 1440 px.
