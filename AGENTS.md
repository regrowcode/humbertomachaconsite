# Repository guidance

## Commands and verification
- Use npm with `package-lock.json`; `npm ci` installs the locked dependencies. Vite 8 requires Node `^20.19.0 || >=22.12.0`.
- `npm run dev` serves the site; `npm run build` produces `dist/`; `npm run preview` serves that build (build first).
- Verify changes with `npm test` and `npm run build`. No lint, formatter, typecheck, or browser-test script is configured.
- Focus a page test with `node --test --test-name-pattern="contacto.html" tests/site.test.mjs` (replace the page name as needed).
- Tests read source HTML/assets directly, without a server or build. They do not exercise browser interactions or CSS; visually check affected pages in ES/EN and at mobile/tablet/desktop widths.

## Wiring and editing pitfalls
- This is a vanilla JS multipage site, not an SPA. The five root HTML files are explicit build entries in `vite.config.js`; adding a page also requires updating that config and the page list in `tests/site.test.mjs`.
- Every page loads `/src/main.js`, which initializes shared behavior on `DOMContentLoaded`. Headers/footers are duplicated in HTML, not generated from components; shared markup changes need all five pages.
- `src/main.js` imports `src/style.css` first and `src/editorial.css` second. The latter is the editorial override layer; base-only changes may be overridden.
- Visible text uses dotted `data-i18n` keys from `src/translations.js`; placeholders use `data-i18n-placeholder`. Add both ES and EN values. Rendering uses `textContent`, so do not put nested markup inside translated elements.
- Language persists under `hm_advisor_lang` in localStorage; `languagechange` refreshes video controls. Legal modal text is bilingual but lives inside `src/main.js`, not the translation file.
- `src/config.js` drives contact links and advisor labels, but not every declared setting is wired up: image paths remain in HTML, and Calendly/social settings are not consumed by `src/main.js`. Verify actual consumers rather than relying on README customization examples.
- Public resources are referenced as `/images/...` and `/videos/...`, not `/public/...`. Edit source files, not generated `dist/`.
- Vercel enables clean URLs with explicit rewrites in `vercel.json`; existing internal navigation uses `.html` links. Do not replace this with an SPA fallback.

## Product constraints and media
- Preserve navbar labels, order, destinations, submenu, ES/EN controls, and appointment CTA unless explicitly asked to change them. Tests assert exact destinations and bilingual wording.
- Keep the site centered on Humberto's personal advisory service, not a property catalogue. Do not introduce unverified credentials, statistics, testimonials, or Golden Visa offerings.
- Ambient films use `src/media.js`: `data-ambient-video`, paired `data-video-toggle`, poster, `preload="none"`, and source `data-src`. Preserve lazy loading, manual pause, offscreen/tab pausing, reduced-motion, and data-saving behavior.
- Tests require the three current clips to remain below 2.5 MB each and exclude the legacy `hero-video.mp4` from the homepage. The legacy clip and unused Vite scaffold assets were intentionally retained; do not mistake them for active entrypoints.
- Stock footage is illustrative, not evidence of Humberto's clients or specific Málaga locations. Keep licensing/source records in `public/videos/CREDITS.md`.

## Publication blockers
- The contact form only prepares a `mailto:` message; it has no delivery backend. Preserve fields and truthful status messaging rather than claiming a successful send.
- Phone/WhatsApp is still the placeholder `+34 600 000 000`; email, existing image rights, credentials, and legal identification need confirmation before publication. See `docs/UI-UX-UPGRADE.md` for the checklist and design rationale.
