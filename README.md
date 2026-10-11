# DeepSeek Harness · Desktop Next website

Public, dependency-free English / Simplified Chinese product website for the independent community desktop client. Hosted with GitHub Pages at https://rangeking.github.io/dsh-desktop-next-website/.

## Local development

Requires Node.js 22 or newer for tests/build. There are no npm dependencies.

- `npm run check`: content, security, localization, interaction contract and build tests, then a public-only build
- `python -m http.server 8000`: preview the repository in a browser
- `?lang=en` or `?lang=zh-CN`: language override
- `?theme=light` or `?theme=dark`: theme override

The website remembers only theme and language locally. No analytics, third-party scripts, external fonts, or account forms. The browser reads only the same-origin public release feed; it never receives GitHub credentials or calls the private repository API. The walkthrough is opt-in; a static native capture appears initially, including when reduced motion is enabled.

## Publishing

GitHub Settings → Pages → Build and deployment → Source: GitHub Actions. Every push to `main` runs the tests, creates `dist/` from an explicit public-file allowlist, then deploys it. Pull requests test and build without deploying. Workflow actions are pinned to verified official commit SHAs. Only deployment has `pages: write` and `id-token: write`; repository contents are read-only. No custom secrets, cross-repository credentials, or access grants are needed.

## Release and access

The website is public; `RangeKing/dsh-desktop-next` remains a private app repository. Version v0.1.1 provides builds for macOS, Windows, and Linux to repository members. The verified public feed supplies version, reviewed bilingual update notes, and exact platform/architecture links; the built-in fallback remains v0.1.1. The installation help explains unsigned test-build status and macOS notarization status alongside release checksums.

Publish only reviewed product copy and demonstration captures here. Application source, credentials, user documents, logs, and installer binaries belong in their original repositories. Update release information after checking the actual release; the site uses a public-only build allowlist.

## Product story and media

The bilingual website follows the user's journey: describe a task, choose the amount of process to see, retain useful context, and review the delivered file. A three-stage task story lets visitors inspect source reading, execution records, and document review. It supports keyboard buttons, translated image descriptions, and full-size image links.

See [MEDIA.md](MEDIA.md) for provenance. All still product images are lossless native PNG captures from the Linux Electron app with sample task/document content. The task story uses controlled demonstration events. The workspace walkthrough is an opt-in, 18.28-second edited native-PNG sequence with held frames. These captures present the product experience rather than live inference or a performance benchmark.

## Reuse and attribution

Preferences initialization is directly adapted from RangeKing/vibemeter-website `index.html` (blob `0d52449ce96cc2644e02b60e3209ad87b6daa6d2`). Locale rendering, theme tokens, responsive product-section structure, and static hosting design adapt the same site's patterns. Product copy, composition, stylesheet, safety disclosures, tests, and deployment workflow are tailored here. See `THIRD_PARTY_NOTICES.md` and retained MIT `LICENSE`.

This independent client is not an official DeepSeek distribution or endorsement. Website source licensing does not grant rights to DeepSeek trademarks or relicense the private application.

The task-led extension gallery previews v0.2.0 with native lossless PNG captures. The available download remains v0.1.1. See [capture notes](MEDIA.md) for provenance and verification scope.

## Verified release synchronization

The new sync workflow is prepared for a repository secret named `DSH_RELEASE_READ_TOKEN`. Automatic private-source synchronization becomes active only after the owner configures that read-only credential and a sync run succeeds. Never put the token in source, this feed, the browser, or an issue.

- Schedule: every six hours, at minute 17, plus a manual Actions run. Only the trusted `main` branch runs it; pull requests cannot use the secret.
- The token must be restricted to **Contents: read** for `RangeKing/dsh-desktop-next`. The workflow's own `GITHUB_TOKEN` updates only this website's public `data/releases.json` and deploys Pages in the same workflow.
- Read scope is fixed: release/asset metadata, tag objects, `release-manifest.json`, and `SHA256SUMS.txt`. Installer binaries, source files, and private release bodies are excluded from the public output. API release bodies are ignored.
- A completion marker, six exact installers, all platform manifests, source identity, sizes, and SHA-256 values must agree. Pre-releases are supported; the GitHub `/releases/latest` endpoint is not used.
- Update notes come only from the manifest's dedicated reviewed `public_notes` field, or an explicit version-bound entry in `data/reviewed-release-notes.json` for legacy releases. They are bounded bilingual plain text.
- Missing credentials, access/rate-limit failures, invalid manifests, and zero usable releases fail the sync without replacing the previous feed. In-progress releases and releases without reviewed public notes remain unpublished in this feed. Only data changes cause a commit. An unchanged feed skips deployment only when the public deployed JSON matches it; a failed or stale deployment is retried automatically on the next sync. If deployment fails after the feed commit, run the manual workflow with **force_deploy** checked to rebuild and redeploy the verified feed even when its data is unchanged.
- The browser checks the complete schema, six platform combinations, fixed repository URLs, and bounded text. A build-embedded copy of the last successful feed keeps the download section usable if fetching the public JSON fails. It never downgrades to an older fetched version.
- Installer links still require GitHub repository access. Publishing metadata does not make the source or installers public. The extension section remains explicitly a **0.2.0 preview** until a complete verified v0.2.0-or-newer feed is available.

The initial v0.1.1 feed uses the previously verified complete release and GitHub asset metadata, including exact sizes and digests; its public update summary is written specifically for this website.
