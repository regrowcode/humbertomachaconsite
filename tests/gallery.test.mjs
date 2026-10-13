import test from 'node:test';
import assert from 'node:assert/strict';
import { initGalleryAutoplay } from '../src/gallery-autoplay.js';

function setup(t) {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const window = new EventTarget();
  const document = new EventTarget();
  document.documentElement = { lang: 'es' };
  document.hidden = false;
  let observer;
  window.IntersectionObserver = class {
    constructor(callback) { observer = callback; }
    observe() {}
  };
  const originalObserver = globalThis.IntersectionObserver;
  globalThis.window = window;
  globalThis.document = document;
  globalThis.IntersectionObserver = window.IntersectionObserver;
  t.after(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    globalThis.IntersectionObserver = originalObserver;
  });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const gallery = new EventTarget();
  const toggle = new EventTarget();
  const icon = {};
  toggle.dataset = {};
  toggle.setAttribute = (key, value) => { toggle[key] = value; };
  toggle.querySelector = () => icon;
  gallery.dataset = { galleryAutoplay: '6500' };
  gallery.querySelector = () => toggle;
  const track = new EventTarget();
  track.scrollLeft = 0;
  track.scrollTo = ({ left }) => { track.scrollLeft = left; };
  track.animate = t.mock.fn(() => ({ finished: Promise.resolve(), cancel() {} }));
  const cards = Array.from({ length: 4 }, () => ({ querySelector: () => ({ decode: async () => {} }) }));
  const reducedMotion = new EventTarget();
  reducedMotion.matches = false;
  initGalleryAutoplay({ gallery, track, cards, reducedMotion,
    cardTarget: card => cards.indexOf(card) * 100,
    scrollTo: left => track.scrollTo({ left }),
  });
  const tick = async (ms = 6500) => { t.mock.timers.tick(ms); await new Promise(resolve => setImmediate(resolve)); };
  const show = (visible = true) => observer([{ isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }]);
  return { window, document, gallery, toggle, track, cards, reducedMotion, tick, show };
}

test('Autoplay waits for visibility, advances one stage and fades the loop boundary', async t => {
  const { track, tick, show, gallery } = setup(t);
  await tick();
  assert.equal(track.scrollLeft, 0);
  show();
  await tick(6499);
  assert.equal(track.scrollLeft, 0);
  await tick(1);
  assert.equal(track.scrollLeft, 100);
  await tick();
  assert.equal(track.scrollLeft, 200);
  await tick();
  assert.equal(track.scrollLeft, 300);
  await tick();
  assert.equal(track.scrollLeft, 0);
  assert.equal(track.animate.mock.callCount(), 2);
  assert.equal(gallery.dataset.galleryPlaying, 'true');
});

test('Playback control, keyboard focus and translated labels preserve manual control', async t => {
  const { gallery, toggle, track, document, tick, show } = setup(t);
  show();
  toggle.dispatchEvent(new Event('click'));
  await tick();
  assert.equal(track.scrollLeft, 0);
  assert.equal(toggle['aria-label'], 'Iniciar avance automático');
  document.documentElement.lang = 'en';
  document.dispatchEvent(new Event('languagechange'));
  assert.equal(toggle['aria-label'], 'Start automatic slideshow');
  toggle.dispatchEvent(new Event('click'));
  await tick();
  assert.equal(track.scrollLeft, 100);
  gallery.dispatchEvent(new Event('focusin'));
  await tick();
  assert.equal(track.scrollLeft, 100);
  assert.equal(gallery.dataset.galleryPlaying, 'false');
  toggle.dispatchEvent(new Event('click'));
  await tick();
  assert.equal(track.scrollLeft, 200);
});

test('Autoplay suspends offscreen, in hidden tabs, on hover and during touch', async t => {
  const { gallery, document, track, window, tick, show } = setup(t);
  show();
  const pointer = type => {
    const event = new Event(type);
    Object.defineProperty(event, 'pointerType', { value: 'mouse' });
    gallery.dispatchEvent(event);
  };
  pointer('pointerenter');
  await tick();
  assert.equal(track.scrollLeft, 0);
  pointer('pointerleave');
  await tick();
  assert.equal(track.scrollLeft, 100);
  show(false);
  await tick();
  assert.equal(track.scrollLeft, 100);
  show();
  document.hidden = true;
  document.dispatchEvent(new Event('visibilitychange'));
  await tick();
  assert.equal(track.scrollLeft, 100);
  document.hidden = false;
  document.dispatchEvent(new Event('visibilitychange'));
  track.dispatchEvent(new Event('pointerdown'));
  await tick();
  assert.equal(track.scrollLeft, 100);
  window.dispatchEvent(new Event('pointerup'));
  await tick();
  assert.equal(track.scrollLeft, 200);
});

test('Reduced motion disables autoplay and follows changes to the preference', async t => {
  const { reducedMotion, toggle, track, tick, show } = setup(t);
  reducedMotion.matches = true;
  reducedMotion.dispatchEvent(new Event('change'));
  show();
  await tick(30000);
  assert.equal(track.scrollLeft, 0);
  assert.equal(toggle.disabled, true);
  assert.match(toggle['aria-label'], /movimiento reducido/);
  reducedMotion.matches = false;
  reducedMotion.dispatchEvent(new Event('change'));
  await tick();
  assert.equal(track.scrollLeft, 100);
  assert.equal(toggle.disabled, false);
});

test('A delayed image cannot advance the gallery after playback has been paused', async t => {
  const { cards, track, toggle, tick, show } = setup(t);
  let resolveImage;
  const image = { decode: () => new Promise(resolve => { resolveImage = resolve; }) };
  cards[1].querySelector = () => image;
  show();
  await tick();
  assert.equal(image.loading, 'eager');
  toggle.dispatchEvent(new Event('click'));
  resolveImage();
  await tick();
  assert.equal(track.scrollLeft, 0);
});
