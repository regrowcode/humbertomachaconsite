// Decorative films remain poster-first: no downloads until visible or requested.
export function initAmbientVideos(getLabels) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection?.saveData);
  const states = new Map();
  const updateLabel = (state) => {
    const playing = !state.video.paused;
    state.button.querySelector('[data-video-icon]').textContent = playing ? 'Ⅱ' : '▷';
    state.button.querySelector('[data-video-label]').textContent = getLabels()[playing ? 'pauseVideo' : 'playVideo'];
  };
  const load = (state) => {
    if (state.loaded) return;
    state.video.querySelectorAll('source[data-src]').forEach((source) => {
      source.src = source.dataset.src;
    });
    state.video.load();
    state.loaded = true;
  };
  const play = async (state) => {
    load(state);
    try { await state.video.play(); } catch { /* Autoplay can be blocked; the poster and manual button remain. */ }
    updateLabel(state);
  };
  const sync = (state) => {
    if (state.visible && !document.hidden && !state.userPaused && !reducedMotion.matches && !saveData) {
      void play(state);
    } else {
      state.video.pause();
    }
  };
  document.querySelectorAll('[data-ambient-video]').forEach((video) => {
    const button = document.querySelector(`[data-video-toggle="${video.id}"]`);
    if (!button) return;
    const state = { video, button, loaded: false, visible: false, userPaused: false };
    states.set(video, state);
    button.hidden = false;
    button.setAttribute('aria-controls', video.id);
    updateLabel(state);
    video.addEventListener('playing', () => {
      video.classList.add('is-playing');
      updateLabel(state);
    });
    video.addEventListener('pause', () => updateLabel(state));
    video.addEventListener('error', () => {
      video.classList.remove('is-playing');
      button.hidden = true;
    });
    button.addEventListener('click', () => {
      if (video.paused) {
        state.userPaused = false;
        void play(state);
      } else {
        state.userPaused = true;
        video.pause();
      }
    });
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const state = states.get(entry.target);
        state.visible = entry.isIntersecting;
        sync(state);
      });
    }, { threshold: .15 });
    states.forEach((state) => observer.observe(state.video));
  }
  document.addEventListener('visibilitychange', () => states.forEach(sync));
  reducedMotion.addEventListener('change', () => states.forEach(sync));
  document.addEventListener('languagechange', () => states.forEach(updateLabel));
}
