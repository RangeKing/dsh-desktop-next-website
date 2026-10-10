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

## Release and access

The website is public; `RangeKing/dsh-desktop-next` remains a private app repository. Version v0.1.0 provides builds for macOS, Windows, and Linux to repository members. Download CTAs link to that exact release. The installation help explains unsigned test-build status and macOS notarization status alongside release checksums.

Publish only reviewed product copy and demonstration captures here. Application source, credentials, user documents, logs, and installer binaries belong in their original repositories. Update release information after checking the actual release; the site uses a public-only build allowlist.

## Product story and media

The bilingual website follows the user's journey: describe a task, choose the amount of process to see, retain useful context, and review the delivered file. A three-stage task story lets visitors inspect source reading, execution records, and document review. It supports keyboard buttons, translated image descriptions, and full-size image links.

See [MEDIA.md](MEDIA.md) for provenance. All product images are actual Linux Electron app captures with sample task/document content. The task story uses controlled demonstration events. The workspace walkthrough is an opt-in, 25.1-second edited sequence with held frames. These captures present the product experience rather than live inference or a performance benchmark.

## Reuse and attribution

Preferences initialization is directly adapted from RangeKing/vibemeter-website `index.html` (blob `0d52449ce96cc2644e02b60e3209ad87b6daa6d2`). Locale rendering, theme tokens, responsive product-section structure, and static hosting design adapt the same site's patterns. Product copy, composition, stylesheet, safety disclosures, tests, and deployment workflow are tailored here. See `THIRD_PARTY_NOTICES.md` and retained MIT `LICENSE`.

This independent client is not an official DeepSeek distribution or endorsement. Website source licensing does not grant rights to DeepSeek trademarks or relicense the private application.
