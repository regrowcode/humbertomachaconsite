# Costa del Sol gallery

The gallery on `zonas.html` replaces the former four property-style cards with
seven locality portraits: Málaga, Torremolinos, Benalmádena, Fuengirola, Mijas,
Marbella and Estepona. It remains a personal advisory page, not a listing catalogue.

## Presentation and behaviour

- Three 9:16 portraits on desktop; two plus a preview on tablet; one plus a
  preview on mobile. Native horizontal scrolling, scroll snap, area shortcuts,
  previous/next buttons and keyboard arrows/Home/End.
- The counter reports the visible range, not an invented total of properties.
- `src/coast.js` enhances static HTML; the cards, links and native scrolling
  still work without JavaScript.
- Films use the existing `src/media.js` lifecycle: lazy sources, muted playback,
  posters, manual pause, offscreen/tab pause, reduced-motion and data-saving support.
- Area cards contain descriptions without individual contact links. The shared
  advisory CTA below the gallery remains available.
- Text and accessible navigation labels are translated into ES, EN and DE.

## Media and pending sign-off

Six Pexels clips are stored locally, cropped to 540 × 960, stripped of audio,
limited to nine seconds and kept below 2.5 MB each. Source pages, authors,
location evidence and licensing notes are in `public/videos/CREDITS.md`.

**Mijas still needs a confirmed, commercially licensed video.** Its current
card uses a real licensed Mijas photograph and clearly identifies that state.
Do not replace it with generic footage of another white village. Once the
correct footage is approved:

1. Add the optimised clip and matching poster under `/videos/` and `/images/`.
2. Replace `.coast-photo-label` with the same video/toggle markup as the other
   six cards, using a unique `mijas-film` ID and lazy `source[data-src]`.
3. Remove the photograph-pending label and update the credits.
4. Update the gallery test's six-video assertion to seven, and validate Mijas
   as a film rather than skipping its video-size check.
5. Run `npm test`, `npm run build` and browser checks across mobile/tablet/desktop.
