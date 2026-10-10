export const coastalAreas = {
  malaga: 'Málaga',
  torremolinos: 'Torremolinos',
  benalmadena: 'Benalmádena',
  fuengirola: 'Fuengirola',
  mijas: 'Mijas',
  marbella: 'Marbella',
  estepona: 'Estepona',
};

// Native scrolling and anchors remain available when JavaScript is disabled.
export function initCoastGallery() {
  const gallery = document.querySelector('[data-zone-gallery]');
  if (!gallery) return;
  const track = gallery.querySelector('.coast-track');
  const cards = [...track.querySelectorAll('.coast-card')];
  const links = [...gallery.querySelectorAll('.coast-selector a')];
  const previous = gallery.querySelector('[data-zone-previous]');
  const next = gallery.querySelector('[data-zone-next]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let scheduled = false;
  const cardLeft = (card) => card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
  const sync = () => {
    scheduled = false;
    current = cards.reduce((closest, card, index) => Math.abs(cardLeft(card) - track.scrollLeft) < Math.abs(cardLeft(cards[closest]) - track.scrollLeft) ? index : closest, 0);
    const bounds = track.getBoundingClientRect();
    const visible = cards.map((card, index) => {
      const rect = card.getBoundingClientRect();
      const overlap = Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left);
      return overlap >= rect.width / 2 ? index : -1;
    }).filter((index) => index >= 0);
    const first = String((visible[0] ?? current) + 1).padStart(2, '0');
    const last = String((visible.at(-1) ?? current) + 1).padStart(2, '0');
    gallery.querySelector('[data-zone-current]').textContent = first === last ? first : `${first}–${last}`;
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    links.forEach((link, index) => {
      link.classList.toggle('is-visible', visible.includes(index));
    });
  };
  const goTo = (index) => track.scrollTo({ left: cardLeft(cards[Math.max(0, Math.min(cards.length - 1, index))]), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  previous.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  links.forEach((link, index) => link.addEventListener('click', (event) => {
    event.preventDefault();
    goTo(index);
  }));
  track.addEventListener('keydown', (event) => {
    if (event.target !== track) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      goTo(event.key === 'Home' ? 0 : cards.length - 1);
    }
  });
  track.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(sync); }
  }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(sync).observe(track);
  gallery.querySelector('.coast-gallery-controls').hidden = false;
  sync();
}
