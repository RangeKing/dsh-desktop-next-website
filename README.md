# DeepSeek Harness · Desktop Next website

Public, dependency-free English / Simplified Chinese product website for the independent community desktop client. Hosted with GitHub Pages at https://rangeking.github.io/dsh-desktop-next-website/.

## Local development

Requires Node.js 22 or newer for tests/build. There are no npm dependencies.

- `npm run check`: content, security, localization, interaction contract and build tests, then a public-only build
- `python -m http.server 8000`: preview the repository in a browser
- `?lang=en` or `?lang=zh-CN`: language override
- `?theme=light` or `?theme=dark`: theme override

The website remembers only theme and language locally. No analytics, third-party scripts, fonts, account forms, API calls, or private-release synchronization. The walkthrough is opt-in; a static native capture appears initially, including when reduced motion is enabled.

## Publishing

GitHub Settings → Pages → Build and deployment → Source: GitHub Actions. Every push to `main` runs the tests, creates `dist/` from an explicit public-file allowlist, then deploys it. Pull requests test and build without deploying. Workflow actions are pinned to verified official commit SHAs. Only deployment has `pages: write` and `id-token: write`; repository contents are read-only. No custom secrets, cross-repository credentials, or access grants are needed.

## Public/private boundary

This repository is public. The app repository `RangeKing/dsh-desktop-next` stays private. Do not copy application source, runtime data, account pages, logs, API keys, binaries, or signed release URLs here. The private Releases link requires pre-existing repository permission and can show 404 to visitors without access. Platform cards describe build targets, not verified installer availability. Initial app installers are unsigned tests and macOS is not notarized. The website makes no passing release-CI claim.

Update public-safe product copy manually after checking the app's documentation. Do not add a cross-repository dispatch token to synchronize private release metadata.

## Media provenance

All five product images are actual app-only Linux Electron captures from October 10, 2026. Task/document content is synthetic fixture data. The native walkthrough is a 25.1-second edited sequence with held frames, not continuous real-time footage or model-execution evidence. No model calls, credentials, user documents, account screens, or private app source are published. Images are original app captures, not simulated UI. The stills are the selected walkthrough frames: conversation 006, preferences 002, background 005, document 009. GIF uses the reviewed full nine-frame walkthrough. Previews are read-only and have format limits.

## Reuse and attribution

Preferences initialization is directly adapted from RangeKing/vibemeter-website `index.html` (blob `0d52449ce96cc2644e02b60e3209ad87b6daa6d2`). Locale rendering, theme tokens, responsive product-section structure, and static hosting design adapt the same site's patterns. Product copy, composition, stylesheet, safety disclosures, tests, and deployment workflow are tailored here. See `THIRD_PARTY_NOTICES.md` and retained MIT `LICENSE`.

This independent client is not an official DeepSeek distribution or endorsement. Website source licensing does not grant rights to DeepSeek trademarks or relicense the private application.
