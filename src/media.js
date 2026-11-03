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
    // Safari needs the media properties set before sources are attached.
    state.video.defaultMuted = true;
    state.video.muted = true;
    state.video.playsInline = true;
    state.video.querySelectorAll('source[data-src]').forEach((source) => {
      source.src = source.dataset.src;
    });
    state.video.load();
    state.loaded = true;
  };
  const play = async (state) => {
    load(state);
    state.shouldPlay = true;
    try {
      await state.video.play();
      if (!state.shouldPlay) state.video.pause();
    } catch { /* Low Power Mode may block autoplay; keep the manual play button. */ }
    updateLabel(state);
  };
  const sync = (state) => {
    if (state.visible && !document.hidden && !state.userPaused && !reducedMotion.matches && !saveData) {
      void play(state);
    } else {
      state.shouldPlay = false;
      state.video.pause();
    }
  };
  document.querySelectorAll('[data-ambient-video]').forEach((video) => {
    const button = document.querySelector(`[data-video-toggle="${video.id}"]`);
    if (!button) return;
    const state = { video, button, loaded: false, visible: false, userPaused: false, shouldPlay: false };
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
      updateLabel(state);
    });
    button.addEventListener('click', () => {
      if (video.paused) {
        state.userPaused = false;
        void play(state);
      } else {
        state.userPaused = true;
        state.shouldPlay = false;
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
  } else {
    states.forEach((state) => {
      state.visible = true;
      sync(state);
    });
  }
  document.addEventListener('visibilitychange', () => states.forEach(sync));
  reducedMotion.addEventListener('change', () => states.forEach(sync));
  document.addEventListener('languagechange', () => states.forEach(updateLabel));
}
