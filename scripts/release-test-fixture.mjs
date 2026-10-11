import {createHash} from 'node:crypto';
const digest = (text) => createHash('sha256').update(text).digest('hex')
export function fixture(version = '0.2.0', prerelease = true) {
  const tag = `v${version}`, source = 'a'.repeat(40)
  const apiBase = `https://github.com/RangeKing/dsh-desktop-next/releases`
  const release = { tag_name: tag, html_url: `${apiBase}/tag/${tag}`, draft: false, prerelease, published_at: '2026-10-11T10:00:00Z', assets: [], body: 'Private release body must never be published', author: { login: 'private-author' } }
  const platforms = [['linux','x64','linux','x86_64',['AppImage']], ['win32','x64','win','x64',['exe']], ['darwin','arm64','mac','arm64',['dmg','zip']], ['darwin','x64','mac','x64',['dmg','zip']]]
  const sums = []
  const manifest = { tag, source_sha: source, unsigned_test: true, private_debug: 'not public', platforms: platforms.map(([platform, arch, os, fileArch, formats]) => ({ tag, source_sha: source, platform, arch, bundled_node: '24.9.0', unsigned_test: true, assets: formats.map((format) => {
    const name = `dsh-desktop-next-${version}-${os}-${fileArch}-unsigned-test.${format}`
    const a = { name, bytes: 1000, sha256: digest(name) }
    sums.push(`${a.sha256}  ${name}`)
    release.assets.push({ name, size: a.bytes, digest: `sha256:${a.sha256}`, state: 'uploaded', browser_download_url: `${apiBase}/download/${tag}/${name}`, uploader: { login: 'private-author' } })
    return a
  }) })) }
  manifest.public_notes = { schemaVersion: 1, version, notes: { en: 'Manage tools for your tasks.', zh: '为任务配置合适的工具。' } }
  const record = { release, expectedSourceSha: source, manifestText: JSON.stringify(manifest), checksumsText: sums.join('\n')+'\n' }
  const refresh = () => {
    for (const [name, text] of [['release-manifest.json', record.manifestText], ['SHA256SUMS.txt', record.checksumsText]]) {
      const a = {name, size:Buffer.byteLength(text), digest:`sha256:${digest(text)}`, state:'uploaded', browser_download_url:`${apiBase}/download/${tag}/${name}`}
      const index = release.assets.findIndex((item) => item.name === name)
      if (index < 0) release.assets.push(a); else release.assets[index] = a
    }
  }
  refresh()
  return { record, refresh, manifest }
}
