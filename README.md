# AuroraView organization website

The bilingual project guide at **https://try-auroraview.github.io/**. The main framework documentation remains at https://try-auroraview.github.io/auroraview/.

This is a small static site. Node generates English and Chinese HTML, responsive WebP images, metadata, and the sitemap. There is no client framework, analytics, CDN font dependency, or runtime package dependency.

## Development

All tools run through `vx`; tasks run through `vx just`.

```sh
vx just install
vx just check
vx just browser
vx just audit
vx just serve
```

The preview is http://127.0.0.1:4173. CI installs the lockfile, validates the production build, runs isolated headless Chromium accessibility/keyboard/responsiveness tests, and records Lighthouse reports before deploying the same artifact to GitHub Pages.

Use `vx just refresh` when intentionally updating dependencies and their lockfile. The task invokes npm with the same Node runtime as `vx node`, avoiding provider defaults that can otherwise select a different Node version. Node 22.23.3 is pinned in `vx.toml`; the wrapper rejects Node versions below 22.19.

## Editing

- `src/content.mjs`: English and Chinese product copy, shared source links, tutorial destinations, and quick-start examples.
- `data/ecosystem.json`: the dated DCC-MCP catalog and per-host AuroraView evidence. Every host has seven responsibilities; a missing AuroraView record defaults to an ecosystem target. Update this data when host evidence changes.
- `src/ecosystem.mjs`: joins catalog entries with explicit integration records. `src/pages.mjs` renders native keyboard-accessible host details on the homepage and complete matrix pages.
- `src/principles.mjs`: source-backed bilingual execution flow, communication directions, stack boundaries, and lifecycle explanation.
- `src/styles.css`: shared semantic tokens, responsive layouts, system theme, and reduced-motion behavior.
- `public/assets/architecture.drawio`: editable native draw.io source for the current architecture. `architecture-proposed.drawio` separately describes the planned shared runtime with DCC-MCP Core. The build generates both locales as SVG and PNG with the editable model embedded in SVG. Keep the semantic HTML descriptions aligned with their model and status.
- `public/assets/source/`: project concept illustrations, the existing Gallery sample, and the main repository’s original layer diagram. `scripts/build.mjs` produces responsive compressed assets.

Use project source and dated validation records for technical claims. Source availability, unit tests, native builds, live-host launch, interactive demonstrations, and releases are distinct evidence gates. Never infer complete support from a repository name or a passing unit test. Update both locales together when evidence changes.

The DCC material workspace hero is a generated concept illustration, labeled as a target experience rather than a runtime capture. Its pictured action is illustrative and is not part of the current adapter tool list. The Gallery and original architecture diagram are existing repository assets. Credits and licensing are described at `/media/` and `/zh/media/`.

Headless automation covers 12 homepage combinations (two locales, two themes, three widths), 16 matrix/principles combinations (two locales, two themes, two widths), and two normal-motion smoke tests. It checks keyboard host-detail toggles, locale routing, image decoding, horizontal overflow, and axe accessibility. Lighthouse reports cover the homepages. These are independent test processes and do not certify native DCC-CUA or host interaction.

## Deployment

The repository uses GitHub Pages with the Actions source. Pushes to `main` and manual workflow dispatches validate and deploy. Pull requests validate without deploying. The public build includes `/`, `/zh/`, bilingual `/ecosystem/`, `/how-it-works/`, and `/media/` pages, `/data/ecosystem.json`, `/llms.txt`, and `/sitemap.xml`.

Read back the public URLs and verify the Pages deployment SHA before claiming delivery. Headless automation is recorded separately from any native DCC-CUA browser or host acceptance.
