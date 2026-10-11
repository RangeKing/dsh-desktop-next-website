import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  buildPublicReleaseFeed,
  buildReleaseFeed,
  compareVersions,
  projectRelease,
  validatePublicNotes,
} from './public-release-feed.mjs'

const digest = (text) => createHash('sha256').update(text).digest('hex')
function fixture(version = '0.2.0', prerelease = true) {
  const tag = `v${version}`,
    source = 'a'.repeat(40)
  const apiBase = `https://github.com/RangeKing/dsh-desktop-next/releases`
  const release = {
    tag_name: tag,
    html_url: `${apiBase}/tag/${tag}`,
    draft: false,
    prerelease,
    published_at: '2026-10-11T10:00:00Z',
    assets: [],
    body: 'Private release body must never be published',
    author: { login: 'private-author' },
  }
  const platforms = [
    ['linux', 'x64', 'linux', 'x86_64', ['AppImage']],
    ['win32', 'x64', 'win', 'x64', ['exe']],
    ['darwin', 'arm64', 'mac', 'arm64', ['dmg', 'zip']],
    ['darwin', 'x64', 'mac', 'x64', ['dmg', 'zip']],
  ]
  const sums = []
  const manifest = {
    tag,
    source_sha: source,
    unsigned_test: true,
    private_debug: 'not public',
    platforms: platforms.map(([platform, arch, os, fileArch, formats]) => ({
      tag,
      source_sha: source,
      platform,
      arch,
      bundled_node: '24.9.0',
      unsigned_test: true,
      assets: formats.map((format) => {
        const name = `dsh-desktop-next-${version}-${os}-${fileArch}-unsigned-test.${format}`
        const a = { name, bytes: 1000, sha256: digest(name) }
        sums.push(`${a.sha256}  ${name}`)
        release.assets.push({
          name,
          size: a.bytes,
          digest: `sha256:${a.sha256}`,
          state: 'uploaded',
          browser_download_url: `${apiBase}/download/${tag}/${name}`,
          uploader: { login: 'private-author' },
        })
        return a
      }),
    })),
  }
  manifest.public_notes = {
    schemaVersion: 1,
    version,
    notes: { en: 'Manage tools for your tasks.', zh: '为任务配置合适的工具。' },
  }
  const record = {
    release,
    expectedSourceSha: source,
    manifestText: JSON.stringify(manifest),
    checksumsText: sums.join('\n') + '\n',
  }
  const refresh = () => {
    for (const [name, text] of [
      ['release-manifest.json', record.manifestText],
      ['SHA256SUMS.txt', record.checksumsText],
    ]) {
      const a = {
        name,
        size: Buffer.byteLength(text),
        digest: `sha256:${digest(text)}`,
        state: 'uploaded',
        browser_download_url: `${apiBase}/download/${tag}/${name}`,
      }
      const index = release.assets.findIndex((item) => item.name === name)
      if (index < 0) release.assets.push(a)
      else release.assets[index] = a
    }
  }
  refresh()
  return { record, refresh, manifest }
}
const rejects = (record, code) =>
  assert.throws(
    () => projectRelease(record),
    (error) => error.code === code,
  )
test('publishes only explicit public fields and all six exact platform assets', () => {
  const { record } = fixture()
  const out = projectRelease(record)
  assert.equal(out.assets.length, 6)
  assert.equal(out.status, 'complete')
  assert.equal(out.assets.find((a) => a.platform === 'linux').arch, 'x64')
  assert.ok(out.assets.find((a) => a.platform === 'linux').name.includes('linux-x86_64'))
  const json = JSON.stringify(out)
  for (const hidden of [
    'Private release body',
    'private-author',
    'not public',
    record.expectedSourceSha,
    'uploader',
    'source_sha',
  ])
    assert.equal(json.includes(hidden), false)
  assert.deepEqual(
    Object.keys(out).sort(),
    [
      'access',
      'assets',
      'notes',
      'prerelease',
      'publishedAt',
      'releaseUrl',
      'status',
      'tagName',
      'unsignedTest',
      'version',
    ].sort(),
  )
})
test('drafts and incomplete/missing installers never become public entries', () => {
  let { record } = fixture()
  record.release.draft = true
  rejects(record, 'unpublished-release')
  ;({ record } = fixture())
  record.release.assets.shift()
  rejects(record, 'incomplete-assets')
  ;({ record } = fixture())
  record.release.assets[0].state = 'new'
  rejects(record, 'asset-not-uploaded')
})
test('installer bytes, API digest, checksum manifest and source must all agree', () => {
  let { record } = fixture()
  record.release.assets[0].size++
  rejects(record, 'asset-not-uploaded')
  ;({ record } = fixture())
  record.release.assets[0].digest = null
  rejects(record, 'asset-digest-mismatch')
  ;({ record } = fixture())
  record.expectedSourceSha = 'b'.repeat(40)
  rejects(record, 'invalid-manifest')
  const f = fixture()
  f.record.checksumsText = f.record.checksumsText.replace(/^[a-f0-9]{64}/, 'b'.repeat(64))
  f.refresh()
  rejects(f.record, 'checksum-mismatch')
})
test('small-file bytes must match uploaded metadata before parsing', () => {
  const { record } = fixture()
  record.manifestText += ' '
  rejects(record, 'asset-not-uploaded')
  const f = fixture()
  f.record.manifestText = f.record.manifestText.replace('private_debug', 'public__debug')
  rejects(f.record, 'asset-digest-mismatch')
})
test('cross-repository, query-bearing, and credential-bearing downloads are refused', () => {
  for (const url of [
    'https://example.com/file.exe',
    'https://github.com/Other/repo/releases/download/v0.2.0/a.exe',
    'https://token@github.com/RangeKing/dsh-desktop-next/releases/download/v0.2.0/a.exe',
  ]) {
    const { record } = fixture()
    record.release.assets[0].browser_download_url = url
    rejects(record, 'asset-url-mismatch')
  }
  const { record } = fixture()
  record.release.assets[0].browser_download_url += '?token=fake'
  rejects(record, 'asset-url-mismatch')
})
test('unknown or duplicate platform sets, wrong arch names, and duplicates fail closed', () => {
  for (const change of [
    (m) => (m.platforms[0].platform = 'unknown'),
    (m) => (m.platforms[0].arch = 'arm64'),
    (m) => (m.platforms[0] = m.platforms[1]),
  ]) {
    const f = fixture()
    change(f.manifest)
    f.record.manifestText = JSON.stringify(f.manifest)
    f.refresh()
    rejects(f.record, 'invalid-platform')
  }
  const { record } = fixture()
  record.release.assets.push(record.release.assets[0])
  rejects(record, 'duplicate-or-invalid-asset')
})
test('source and platform build labels cannot be silently relabelled', () => {
  const f = fixture()
  f.manifest.platforms[0].unsigned_test = false
  f.record.manifestText = JSON.stringify(f.manifest)
  f.refresh()
  rejects(f.record, 'invalid-platform')
  const g = fixture()
  g.manifest.platforms[0].assets[0].name = '../asset'
  g.record.manifestText = JSON.stringify(g.manifest)
  g.refresh()
  rejects(g.record, 'missing-installer')
})
test('only dedicated, bounded bilingual plain notes are accepted', () => {
  const good = {
    schemaVersion: 1,
    version: '0.2.0',
    notes: { en: 'Useful changes', zh: '适用的功能变化' },
  }
  assert.deepEqual(validatePublicNotes(good, '0.2.0'), good)
  for (const bad of [
    { ...good, private: 'data' },
    { ...good, version: '0.1.1' },
    { ...good, notes: { en: '<script>x</script>', zh: '你好' } },
    { ...good, notes: { en: 'https://private.invalid/token', zh: '你好' } },
    { ...good, notes: { en: 'x'.repeat(1201), zh: '你好' } },
  ])
    assert.throws(() => validatePublicNotes(bad, '0.2.0'))
})
test('legacy releases require an explicitly supplied public note record, never body fallback', () => {
  const f = fixture('0.1.1')
  delete f.manifest.public_notes
  f.record.manifestText = JSON.stringify(f.manifest)
  f.refresh()
  rejects(f.record, 'invalid-public-notes')
  f.record.reviewedNotes = {
    schemaVersion: 1,
    version: '0.1.1',
    notes: { en: 'Clearer typography and lossless screenshots.', zh: '清晰字体与无损界面截图。' },
  }
  assert.equal(projectRelease(f.record).notes.zh, f.record.reviewedNotes.notes.zh)
})
test('invalid dates, channel confusion, and malformed semantic versions fail closed', () => {
  let { record } = fixture()
  record.release.published_at = '2026-02-30T10:00:00Z'
  rejects(record, 'invalid-release-metadata')
  ;({ record } = fixture('0.2.0-alpha.1', false))
  rejects(record, 'invalid-release-channel')
  for (const version of ['01.0.0', '1.0', '1.0.0-01', '1.0.0+build', '1.0.0/../../'])
    assert.throws(() => compareVersions(version, '1.0.0'))
})
test('semantic ordering handles numeric prereleases and distinct release channels', () => {
  assert.ok(compareVersions('0.10.0', '0.9.0') > 0)
  assert.ok(compareVersions('1.0.0-alpha.10', '1.0.0-alpha.2') > 0)
  assert.ok(compareVersions('1.0.0', '1.0.0-rc.1') > 0)
  const { feed } = buildReleaseFeed({
    records: [
      fixture('0.1.1', false).record,
      fixture('0.2.0', true).record,
      fixture('0.2.0-rc.1').record,
    ],
    generatedAt: '2026-10-11T10:00:00Z',
  })
  assert.deepEqual(
    feed.releases.map((r) => r.version),
    ['0.2.0', '0.2.0-rc.1', '0.1.1'],
  )
  assert.equal(feed.releases.find((r) => !r.prerelease).version, '0.1.1')
})
test('partial release does not hide last valid version and zero valid records fails before write', () => {
  const bad = fixture('0.3.0').record
  bad.release.assets = []
  const { feed, rejected } = buildReleaseFeed({
    records: [bad, fixture('0.2.0').record],
    generatedAt: '2026-10-11T10:00:00Z',
  })
  assert.deepEqual(
    feed.releases.map((r) => r.version),
    ['0.2.0'],
  )
  assert.deepEqual(rejected, [{ code: 'incomplete-assets' }])
  assert.throws(
    () => buildReleaseFeed({ records: [bad], generatedAt: '2026-10-11T10:00:00Z' }),
    /no-complete-public-releases/,
  )
})
test('feed bounds keep twenty latest verified versions without runtime or private fields', () => {
  const { feed } = buildReleaseFeed({
    records: Array.from({ length: 25 }, (_, n) => fixture(`1.0.${n}`).record),
    generatedAt: '2026-10-11T10:00:00Z',
  })
  assert.equal(feed.releases.length, 20)
  assert.equal(feed.releases[0].version, '1.0.24')
  assert.equal(feed.releases.at(-1).version, '1.0.5')
})
test('previously published records merge only after complete public-schema revalidation', () => {
  const a = projectRelease(fixture('0.1.1').record),
    b = projectRelease(fixture('0.2.0').record)
  const feed = buildPublicReleaseFeed({ records: [a, b], generatedAt: '2026-10-11T10:00:00Z' })
  assert.deepEqual(
    feed.releases.map((r) => r.version),
    ['0.2.0', '0.1.1'],
  )
  for (const bad of [
    { ...a, body: 'private' },
    { ...a, sourceSha: 'a'.repeat(40) },
    { ...a, assets: a.assets.slice(1) },
    { ...a, notes: { en: '<b>unsafe</b>', zh: '你好' } },
  ])
    assert.throws(() => buildPublicReleaseFeed({ records: [bad], generatedAt: feed.generatedAt }))
  assert.throws(
    () => buildPublicReleaseFeed({ records: [a, a], generatedAt: feed.generatedAt }),
    /invalid-public-release/,
  )
  a.assets[0].url = 'https://elsewhere.invalid/download'
  assert.throws(
    () => buildPublicReleaseFeed({ records: [a], generatedAt: feed.generatedAt }),
    /invalid-public-asset/,
  )
})

test('twenty full bilingual summaries fit the shared 512 KiB feed contract', () => {
  const records = Array.from({ length: 20 }, (_, i) => {
    const f = fixture(`1.0.${i}`)
    f.manifest.public_notes.notes = { en: '字'.repeat(1200), zh: '文'.repeat(1200) }
    f.record.manifestText = JSON.stringify(f.manifest)
    f.refresh()
    return f.record
  })
  const { feed } = buildReleaseFeed({ records, generatedAt: '2026-10-11T10:00:00Z' })
  const bytes = Buffer.byteLength(JSON.stringify(feed, null, 2) + '\n')
  assert.ok(bytes > 128 * 1024)
  assert.ok(bytes <= 524288)
  assert.deepEqual(
    buildPublicReleaseFeed({ records: feed.releases, generatedAt: feed.generatedAt }),
    feed,
  )
})
