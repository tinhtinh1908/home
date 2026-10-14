# Miuix web preview

Design reference: https://github.com/miuix-kotlin-multiplatform/miuix
Reference revision: 6ef604ae6d53e4b241cdb89ccbf2caf86a7a33d0 (0.9.4).

The web UI uses original HTML/CSS, borrowing component proportions and color tokens:
- Button and card radius 16px; primary controls at least 40px high.
- Dialog radius 32px; neutral surfaces, restrained dividers and no decorative glass gradients.
- Light accent #3482FF; dark accent #277AF7; dark cards #242424.
- Separate desktop rail and mobile navigation; flexible long labels and action rows.
- Dialog/page/press transitions with reduced-motion fallback.

Theme previews, download/open links, release counters, FAQ documents/videos, contact links,
donation QR/copy and donor list retain their existing content and behavior.
The deployment workflow remains manual (`workflow_dispatch`). This preview does not deploy it.

Run `npm test` for existing content/cache checks. Run `npm run build:preview` to produce
`build/preview`, then serve it with `python3 -m http.server --directory build/preview`.
