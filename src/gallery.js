import { initGalleryAutoplay } from './gallery-autoplay.js';

// Native horizontal galleries; automatic playback is opt-in per section.
export function initImageGalleries() {
  document.querySelectorAll('[data-image-gallery]').forEach((gallery) => {
    const track = gallery.querySelector('[data-gallery-track]');
    const cards = [...track.querySelectorAll('[data-gallery-card]')];
    const controls = gallery.querySelector('[data-gallery-controls]');
    const previous = gallery.querySelector('[data-gallery-previous]');
    const next = gallery.querySelector('[data-gallery-next]');
    const counter = gallery.querySelector('[data-gallery-current]');
    const singleSlide = gallery.hasAttribute('data-gallery-single');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let scheduled = false;
    const cardLeft = (card) => card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
    // The last card may not align with the left edge when multiple cards fit.
    const cardTarget = (card) => Math.max(0, Math.min(cardLeft(card), track.scrollWidth - track.clientWidth));
    const sync = () => {
      scheduled = false;
      const bounds = track.getBoundingClientRect();
      const visible = cards.map((card, index) => {
        const rect = card.getBoundingClientRect();
        return Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left) >= rect.width / 2 ? index + 1 : null;
      }).filter((index) => index !== null);
      const first = String(visible[0] ?? 1).padStart(2, '0');
      const last = String(visible.at(-1) ?? 1).padStart(2, '0');
      if (singleSlide) {
        const nearest = cards.reduce((closest, card, index) => Math.abs(cardTarget(card) - track.scrollLeft) < Math.abs(cardTarget(cards[closest]) - track.scrollLeft) ? index : closest, 0);
        counter.textContent = String(nearest + 1).padStart(2, '0');
      } else {
        counter.textContent = first === last ? first : `${first}–${last}`;
      }
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    };
    const scrollTo = (left) => track.scrollTo({ left, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    const move = (direction) => {
      const targets = cards.map(cardTarget);
      const target = direction > 0
        ? targets.find((left) => left > track.scrollLeft + 2)
        : targets.findLast((left) => left < track.scrollLeft - 2);
      if (target !== undefined) scrollTo(target);
    };
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('keydown', (event) => {
      if (event.target !== track) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        move(event.key === 'ArrowRight' ? 1 : -1);
      }
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        scrollTo(event.key === 'Home' ? 0 : track.scrollWidth - track.clientWidth);
      }
    });
    track.addEventListener('scroll', () => {
      if (!scheduled) { scheduled = true; requestAnimationFrame(sync); }
    }, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(track);
    controls.hidden = false;
    sync();
    if (gallery.hasAttribute('data-gallery-autoplay')) {
      initGalleryAutoplay({ gallery, track, cards, cardTarget, scrollTo, reducedMotion });
    }
  });
}
