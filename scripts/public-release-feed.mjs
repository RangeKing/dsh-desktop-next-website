/** Pure public-data projection. Never reads release bodies, credentials, or installer bytes. */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const RELEASE_REPOSITORY = 'RangeKing/dsh-desktop-next'
export const PUBLIC_FEED_MAX_BYTES = 524288
const base = `https://github.com/${RELEASE_REPOSITORY}/releases`
const hex = /^[a-f0-9]{64}$/
const versionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/
const combos = new Map([
  ['linux/x64', { platform: 'linux', os: 'linux', fileArch: 'x86_64', formats: ['AppImage'] }],
  ['win32/x64', { platform: 'windows', os: 'win', fileArch: 'x64', formats: ['exe'] }],
  ['darwin/x64', { platform: 'macos', os: 'mac', fileArch: 'x64', formats: ['dmg', 'zip'] }],
  ['darwin/arm64', { platform: 'macos', os: 'mac', fileArch: 'arm64', formats: ['dmg', 'zip'] }],
])
export class FeedValidationError extends Error {
  constructor(code) {
    super(code)
    this.name = 'FeedValidationError'
    this.code = code
  }
}
const requireValue = (condition, code) => {
  if (!condition) throw new FeedValidationError(code)
}
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const keysExactly = (value, keys) =>
  object(value) && Object.keys(value).sort().join(',') === [...keys].sort().join(',')
const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex')
const validDate = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().replace('.000Z', 'Z') === value.replace('.000Z', 'Z')
function parseVersion(value) {
  requireValue(typeof value === 'string' && value.length <= 80, 'invalid-version')
  const match = versionPattern.exec(value)
  requireValue(
    match && match.slice(1, 4).every((part) => Number.isSafeInteger(Number(part))),
    'invalid-version',
  )
  const pre = match[4]?.split('.') ?? []
  requireValue(
    pre.every((part) => !/^\d+$/.test(part) || part === '0' || !part.startsWith('0')),
    'invalid-version',
  )
  return { core: match.slice(1, 4).map(Number), pre }
}
export function compareVersions(a, b) {
  const av = parseVersion(a),
    bv = parseVersion(b)
  for (let i = 0; i < 3; i++) if (av.core[i] !== bv.core[i]) return av.core[i] > bv.core[i] ? 1 : -1
  if (!av.pre.length || !bv.pre.length)
    return av.pre.length === bv.pre.length ? 0 : av.pre.length ? -1 : 1
  for (let i = 0; i < Math.max(av.pre.length, bv.pre.length); i++) {
    const x = av.pre[i],
      y = bv.pre[i]
    if (x === y) continue
    if (x === undefined || y === undefined) return x === undefined ? -1 : 1
    const xn = /^\d+$/.test(x),
      yn = /^\d+$/.test(y)
    if (xn && yn) return BigInt(x) > BigInt(y) ? 1 : -1
    if (xn !== yn) return xn ? -1 : 1
    return x > y ? 1 : -1
  }
  return 0
}

/** Only this dedicated, reviewed source field may become public update copy. */
export function validatePublicNotes(value, version) {
  parseVersion(version)
  requireValue(
    keysExactly(value, ['schemaVersion', 'version', 'notes']) &&
      value.schemaVersion === 1 &&
      value.version === version,
    'invalid-public-notes',
  )
  requireValue(keysExactly(value.notes, ['en', 'zh']), 'invalid-public-notes')
  for (const text of Object.values(value.notes)) {
    requireValue(
      typeof text === 'string' &&
        text.trim() === text &&
        text.length >= 2 &&
        text.length <= 1200 &&
        !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text) &&
        !/[a-z][a-z0-9+.-]*:\/\//i.test(text),
      'invalid-public-notes',
    )
  }
  return { schemaVersion: 1, version, notes: { en: value.notes.en, zh: value.notes.zh } }
}

/** release is the GitHub API object; small-file text is checked against its API digest. */
export function projectRelease({
  release,
  manifestText,
  checksumsText,
  expectedSourceSha,
  reviewedNotes,
}) {
  requireValue(
    object(release) && release.draft === false && typeof release.prerelease === 'boolean',
    'unpublished-release',
  )
  requireValue(
    typeof release.tag_name === 'string' && release.tag_name.startsWith('v'),
    'invalid-tag',
  )
  const version = release.tag_name.slice(1)
  parseVersion(version)
  requireValue(
    release.html_url === `${base}/tag/${release.tag_name}` && validDate(release.published_at),
    'invalid-release-metadata',
  )
  requireValue(!version.includes('-') || release.prerelease, 'invalid-release-channel')
  requireValue(
    typeof expectedSourceSha === 'string' && /^[a-f0-9]{40}$/.test(expectedSourceSha),
    'unverified-source',
  )
  requireValue(
    Array.isArray(release.assets) && release.assets.length >= 8 && release.assets.length <= 40,
    'incomplete-assets',
  )
  const apiAssets = new Map()
  for (const a of release.assets) {
    requireValue(
      object(a) && typeof a.name === 'string' && a.name.length <= 180 && !apiAssets.has(a.name),
      'duplicate-or-invalid-asset',
    )
    apiAssets.set(a.name, a)
  }
  const checkAsset = (name, bytes, digest) => {
    const a = apiAssets.get(name)
    requireValue(
      a &&
        a.state === 'uploaded' &&
        Number.isSafeInteger(a.size) &&
        a.size === bytes &&
        a.size > 0 &&
        a.size <= 2 * 1024 ** 3,
      'asset-not-uploaded',
    )
    requireValue(hex.test(digest) && a.digest === `sha256:${digest}`, 'asset-digest-mismatch')
    const url = `${base}/download/${release.tag_name}/${encodeURIComponent(name)}`
    requireValue(a.browser_download_url === url, 'asset-url-mismatch')
    return { name, sizeBytes: bytes, sha256: digest, url }
  }
  requireValue(
    typeof manifestText === 'string' &&
      Buffer.byteLength(manifestText) <= 128 * 1024 &&
      typeof checksumsText === 'string' &&
      Buffer.byteLength(checksumsText) <= 8192,
    'oversized-release-metadata',
  )
  checkAsset('release-manifest.json', Buffer.byteLength(manifestText), sha256(manifestText))
  checkAsset('SHA256SUMS.txt', Buffer.byteLength(checksumsText), sha256(checksumsText))
  let manifest
  try {
    manifest = JSON.parse(manifestText)
  } catch {
    throw new FeedValidationError('invalid-manifest')
  }
  requireValue(
    object(manifest) &&
      manifest.tag === release.tag_name &&
      manifest.source_sha === expectedSourceSha &&
      manifest.unsigned_test === true &&
      Array.isArray(manifest.platforms) &&
      manifest.platforms.length === 4,
    'invalid-manifest',
  )
  const notes = validatePublicNotes(manifest.public_notes ?? reviewedNotes, version).notes
  const lines = checksumsText.trimEnd().split(/\r?\n/)
  requireValue(lines.length === 6, 'incomplete-checksums')
  const sums = new Map()
  for (const line of lines) {
    const match = /^([a-f0-9]{64})  ([A-Za-z0-9._-]+)$/.exec(line)
    requireValue(match && !sums.has(match[2]), 'invalid-checksums')
    sums.set(match[2], match[1])
  }
  const platforms = new Set(),
    assets = []
  for (const m of manifest.platforms) {
    requireValue(object(m), 'invalid-platform')
    const key = `${m.platform}/${m.arch}`,
      combo = combos.get(key)
    requireValue(
      combo &&
        !platforms.has(key) &&
        m.tag === release.tag_name &&
        m.source_sha === expectedSourceSha &&
        m.unsigned_test === true &&
        m.bundled_node === '24.9.0',
      'invalid-platform',
    )
    platforms.add(key)
    requireValue(
      Array.isArray(m.assets) && m.assets.length === combo.formats.length,
      'incomplete-platform',
    )
    for (const format of combo.formats) {
      const name = `dsh-desktop-next-${version}-${combo.os}-${combo.fileArch}-unsigned-test.${format}`
      const matches = m.assets.filter((a) => object(a) && a.name === name)
      requireValue(matches.length === 1, 'missing-installer')
      const a = matches[0]
      requireValue(sums.get(name) === a.sha256, 'checksum-mismatch')
      assets.push({
        ...checkAsset(name, a.bytes, a.sha256),
        platform: combo.platform,
        arch: m.arch,
        format,
      })
    }
  }
  requireValue(assets.length === 6 && platforms.size === 4 && sums.size === 6, 'incomplete-assets')
  return {
    version,
    tagName: release.tag_name,
    publishedAt: release.published_at,
    prerelease: release.prerelease,
    status: 'complete',
    access: 'repository-members',
    unsignedTest: true,
    releaseUrl: release.html_url,
    notes,
    assets: assets.sort((a, b) => a.name.localeCompare(b.name, 'en')),
  }
}

/** Invalid/in-progress versions are omitted. Empty/failing collection must not replace a previous feed. */
export function buildReleaseFeed({ records, generatedAt }) {
  requireValue(
    Array.isArray(records) && records.length <= 100 && validDate(generatedAt),
    'invalid-feed-input',
  )
  const valid = [],
    rejected = [],
    seen = new Set()
  for (const record of records) {
    try {
      const release = projectRelease(record)
      requireValue(!seen.has(release.tagName), 'duplicate-release')
      seen.add(release.tagName)
      valid.push(release)
    } catch (error) {
      if (!(error instanceof FeedValidationError)) throw error
      rejected.push({ code: error.code })
    }
  }
  requireValue(valid.length > 0, 'no-complete-public-releases')
  valid.sort(
    (a, b) =>
      compareVersions(b.version, a.version) ||
      Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  )
  return {
    feed: boundedFeed({ schemaVersion: 1, generatedAt, releases: valid.slice(0, 20) }),
    rejected,
  }
}

function boundedFeed(feed) {
  requireValue(
    Buffer.byteLength(JSON.stringify(feed, null, 2) + '\n') <= PUBLIC_FEED_MAX_BYTES,
    'public-feed-too-large',
  )
  return feed
}

/** Validate persisted public records before merging a previously successful feed. */
export function buildPublicReleaseFeed({ records, generatedAt }) {
  requireValue(
    Array.isArray(records) && records.length > 0 && records.length <= 120 && validDate(generatedAt),
    'invalid-public-feed',
  )
  const seen = new Set()
  const releases = records.map((r) => {
    requireValue(
      keysExactly(r, [
        'version',
        'tagName',
        'publishedAt',
        'prerelease',
        'status',
        'access',
        'unsignedTest',
        'releaseUrl',
        'notes',
        'assets',
      ]),
      'invalid-public-release',
    )
    parseVersion(r.version)
    requireValue(
      r.tagName === `v${r.version}` &&
        !seen.has(r.tagName) &&
        r.status === 'complete' &&
        r.access === 'repository-members' &&
        r.unsignedTest === true &&
        typeof r.prerelease === 'boolean' &&
        (!r.version.includes('-') || r.prerelease) &&
        validDate(r.publishedAt) &&
        r.releaseUrl === `${base}/tag/${r.tagName}`,
      'invalid-public-release',
    )
    seen.add(r.tagName)
    const notes = validatePublicNotes(
      { schemaVersion: 1, version: r.version, notes: r.notes },
      r.version,
    ).notes
    requireValue(Array.isArray(r.assets) && r.assets.length === 6, 'incomplete-public-assets')
    const assets = []
    for (const [key, combo] of combos)
      for (const format of combo.formats) {
        const arch = key.split('/')[1]
        const name = `dsh-desktop-next-${r.version}-${combo.os}-${combo.fileArch}-unsigned-test.${format}`
        const matches = r.assets.filter((a) => object(a) && a.name === name)
        requireValue(matches.length === 1, 'incomplete-public-assets')
        const a = matches[0]
        requireValue(
          keysExactly(a, ['name', 'sizeBytes', 'sha256', 'url', 'platform', 'arch', 'format']) &&
            a.platform === combo.platform &&
            a.arch === arch &&
            a.format === format &&
            Number.isSafeInteger(a.sizeBytes) &&
            a.sizeBytes > 0 &&
            a.sizeBytes <= 2 * 1024 ** 3 &&
            typeof a.sha256 === 'string' &&
            hex.test(a.sha256) &&
            a.url === `${base}/download/${r.tagName}/${encodeURIComponent(name)}`,
          'invalid-public-asset',
        )
        assets.push({
          name,
          platform: a.platform,
          arch,
          format,
          sizeBytes: a.sizeBytes,
          sha256: a.sha256,
          url: a.url,
        })
      }
    return {
      version: r.version,
      tagName: r.tagName,
      publishedAt: r.publishedAt,
      prerelease: r.prerelease,
      status: 'complete',
      access: 'repository-members',
      unsignedTest: true,
      releaseUrl: r.releaseUrl,
      notes,
      assets: assets.sort((a, b) => a.name.localeCompare(b.name, 'en')),
    }
  })
  releases.sort(
    (a, b) =>
      compareVersions(b.version, a.version) ||
      Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  )
  return boundedFeed({ schemaVersion: 1, generatedAt, releases: releases.slice(0, 20) })
}

// Release validate job uses only the dedicated source notes, never release.body.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    requireValue(process.argv.length === 4 && process.argv[2] === 'notes', 'invalid-command')
    const version = process.argv[3]
    const text = readFileSync('public-release-notes.json', 'utf8')
    requireValue(Buffer.byteLength(text) <= 8192, 'invalid-public-notes')
    console.log(JSON.stringify(validatePublicNotes(JSON.parse(text), version)))
  } catch (error) {
    console.error(error instanceof FeedValidationError ? error.code : 'invalid-public-notes')
    process.exitCode = 1
  }
}
