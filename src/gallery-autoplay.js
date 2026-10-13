import { translations } from './translations.js';

// Only run while the photos are in view. Manual exploration takes precedence.
export function initGalleryAutoplay({ gallery, track, cards, cardTarget, scrollTo, reducedMotion }) {
  const toggle = gallery.querySelector('[data-gallery-playback]');
  if (!toggle || cards.length < 2) return;
  const interval = Math.max(5000, Number(gallery.dataset.galleryAutoplay) || 6500);
  let timer;
  let animation;
  let generation = 0;
  let visible = !('IntersectionObserver' in window);
  let hovered = false;
  let touching = false;
  let paused = false;
  const canPlay = () => !paused && !hovered && !touching && visible && !document.hidden && !reducedMotion.matches;

  const updateLabel = () => {
    const key = reducedMotion.matches ? 'galleryMotionDisabled' : paused ? 'playGallery' : 'pauseGallery';
    const t = translations[document.documentElement.lang] || translations.es;
    toggle.dataset.i18nAriaLabel = `method.${key}`;
    toggle.setAttribute('aria-label', t.method[key]);
    toggle.disabled = reducedMotion.matches;
    toggle.querySelector('span').textContent = paused || reducedMotion.matches ? '▶' : 'Ⅱ';
    gallery.dataset.galleryPlaying = String(canPlay());
  };
  const cancel = () => {
    clearTimeout(timer);
    generation++;
    animation?.cancel();
    animation = null;
  };
  const schedule = () => {
    cancel();
    updateLabel();
    if (canPlay()) timer = setTimeout(advance, interval);
  };
  const advance = async () => {
    const currentGeneration = generation;
    const current = cards.reduce((closest, card, index) =>
      Math.abs(cardTarget(card) - track.scrollLeft) < Math.abs(cardTarget(cards[closest]) - track.scrollLeft) ? index : closest, 0);
    const next = (current + 1) % cards.length;
    const image = cards[next].querySelector('img');
    // Decode the incoming photo before revealing it, including lazy images.
    if (image) {
      image.loading = 'eager';
      try { await image.decode(); } catch { /* Keep navigation usable if an image fails. */ }
    }
    if (!canPlay() || currentGeneration !== generation) return;
    if (next === 0 && typeof track.animate === 'function') {
      // Fade the loop boundary instead of sweeping backwards over three stages.
      animation = track.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' });
      try { await animation.finished; } catch { return; }
      if (!canPlay() || currentGeneration !== generation) return;
      track.scrollTo({ left: cardTarget(cards[0]), behavior: 'instant' });
      animation.cancel();
      animation = track.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 480, easing: 'ease-out' });
      try { await animation.finished; } catch { return; }
      animation = null;
    } else {
      scrollTo(cardTarget(cards[next]));
    }
    if (currentGeneration === generation) schedule();
  };

  toggle.addEventListener('click', () => { paused = !paused; schedule(); });
  gallery.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') { hovered = true; schedule(); }
  });
  gallery.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') { hovered = false; schedule(); }
  });
  // Keyboard users retain control until they explicitly choose playback again.
  gallery.addEventListener('focusin', (event) => {
    if (event.target !== toggle) { paused = true; schedule(); }
  });
  track.addEventListener('pointerdown', () => { touching = true; schedule(); }, { passive: true });
  window.addEventListener('pointerup', () => {
    if (touching) { touching = false; schedule(); }
  }, { passive: true });
  window.addEventListener('pointercancel', () => {
    if (touching) { touching = false; schedule(); }
  }, { passive: true });
  track.addEventListener('wheel', () => { paused = true; schedule(); }, { passive: true });
  track.addEventListener('scrollend', () => {
    // Give a full reading interval after touch or manual scrolling.
    if (!animation) schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('languagechange', updateLabel);
  window.addEventListener('pagehide', cancel);
  window.addEventListener('pageshow', schedule);
  reducedMotion.addEventListener('change', schedule);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= .35;
      schedule();
    }, { threshold: [0, .35] }).observe(track);
  }
  schedule();
}
