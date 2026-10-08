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

- `src/content.mjs`: English and Chinese copy, project map, validation status, tutorial destinations, and code examples.
- `src/styles.css`: shared semantic tokens, responsive layouts, system theme, and reduced-motion behavior.
- `public/assets/architecture.drawio`: editable native draw.io source for the current architecture. `architecture-proposed.drawio` separately describes the planned shared runtime with DCC-MCP Core. The build generates both locales as SVG and PNG with the editable model embedded in SVG. Keep the semantic HTML descriptions aligned with their model and status.
- `public/assets/source/`: original project illustrations and the existing Gallery sample. `scripts/build.mjs` produces responsive compressed assets.

Use project source and dated validation records for technical claims. Source availability, unit tests, native builds, live-host launch, interactive demonstrations, and releases are distinct evidence gates. Never infer complete support from a repository name or a passing unit test. Update both locales together when evidence changes.

The source PNGs are concept illustrations except for the existing Gallery sample. Credits and licensing are described at `/media/` and `/zh/media/`. They are never presented as proof of a new host integration.

## Deployment

The repository uses GitHub Pages with the Actions source. Pushes to `main` and manual workflow dispatches validate and deploy. Pull requests validate without deploying. The public build includes `/`, `/zh/`, `/media/`, `/zh/media/`, `/llms.txt`, and `/sitemap.xml`.

Read back the public URLs and verify the Pages deployment SHA before claiming delivery. Headless automation is recorded separately from any native DCC-CUA browser or host acceptance.
