import test from 'node:test';
import assert from 'node:assert/strict';
import { initAmbientVideos } from '../src/media.js';

function setup(t, { reduced = false, saveData = false, observer = true } = {}) {
  const originals = Object.fromEntries(['window', 'document', 'navigator', 'IntersectionObserver'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => {
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const video = new EventTarget();
  video.id = 'hero-film';
  video.paused = true;
  const classes = new Set();
  video.classList = { add: value => classes.add(value), remove: value => classes.delete(value) };
  const source = { dataset: { src: '/videos/home-costa-del-sol.mp4' } };
  video.querySelectorAll = () => [source];
  video.load = t.mock.fn(() => {
    assert.equal(video.muted, true);
    assert.equal(video.defaultMuted, true);
    assert.equal(video.playsInline, true);
  });
  video.play = t.mock.fn(async () => {
    video.paused = false;
    video.dispatchEvent(new Event('playing'));
  });
  video.pause = t.mock.fn(() => {
    video.paused = true;
    video.dispatchEvent(new Event('pause'));
  });
  const button = new EventTarget();
  const label = {};
  button.setAttribute = () => {};
  button.querySelector = () => label;
  const motion = new EventTarget();
  motion.matches = reduced;
  const document = new EventTarget();
  document.hidden = false;
  document.querySelectorAll = () => [video];
  document.querySelector = () => button;
  let intersect;
  const window = { matchMedia: () => motion };
  if (observer) {
    window.IntersectionObserver = class {
      constructor(callback) { intersect = callback; }
      observe() {}
    };
    Object.defineProperty(globalThis, 'IntersectionObserver', { configurable: true, value: window.IntersectionObserver });
  }
  for (const [key, value] of Object.entries({ window, document, navigator: { connection: { saveData } } })) {
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  initAmbientVideos(() => ({ playVideo: 'Play', pauseVideo: 'Pause' }));
  return { video, button, document, source, visible: value => intersect([{ target: video, isIntersecting: value }]) };
}

test('Ambient video stays lazy and sets Safari properties before loading', async t => {
  const { video, source, visible } = setup(t);
  assert.equal(source.src, undefined);
  visible(true);
  await Promise.resolve();
  assert.equal(source.src, source.dataset.src);
  assert.equal(video.load.mock.callCount(), 1);
  assert.equal(video.paused, false);
  visible(false);
  assert.equal(video.paused, true);
});

test('Blocked autoplay keeps a usable manual playback control', async t => {
  const { video, button, visible } = setup(t);
  video.play.mock.mockImplementationOnce(async () => { throw new Error('NotAllowedError'); });
  visible(true);
  await Promise.resolve();
  assert.equal(button.hidden, false);
  button.dispatchEvent(new Event('click'));
  await Promise.resolve();
  assert.equal(video.paused, false);
  button.dispatchEvent(new Event('click'));
  visible(false);
  visible(true);
  assert.equal(video.paused, true);
});

for (const preference of [{ reduced: true }, { saveData: true }]) {
  test(`Ambient video respects ${Object.keys(preference)[0]} but allows manual play`, async t => {
    const { video, button, document, visible } = setup(t, preference);
    visible(true);
    assert.equal(video.load.mock.callCount(), 0);
    button.dispatchEvent(new Event('click'));
    await Promise.resolve();
    assert.equal(video.paused, false);
    document.hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(video.paused, true);
  });
}

test('Ambient video works without IntersectionObserver', async t => {
  const { video } = setup(t, { observer: false });
  await Promise.resolve();
  assert.equal(video.paused, false);
});
