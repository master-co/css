import assert from 'node:assert/strict'
import { isAbsolute, relative, resolve, sep } from 'node:path'

const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
const packageName = '(?:css(?:-[a-z0-9-]+)?|create-css|eslint-(?:config|plugin)-css)'
const packageReference = new RegExp(`(@master/${packageName}@)VERSION(?![\\w.-])`, 'g')
const cdnReference = new RegExp(`(https://cdn\\.master\\.co/${packageName}@)VERSION(?![\\w.-])`, 'g')

/**
 * One version projection for rendered MDX and portable Markdown code examples.
 * @param {string} source
 * @param {string} version
 */
export function releaseCode(source, version) {
  assert.equal(typeof source, 'string', 'Release example source must be text')
  assert.match(version, versionPattern, 'Release examples require an explicit version')
  return source.replace(packageReference, (_, prefix) => prefix + version)
    .replace(cdnReference, (_, prefix) => prefix + version)
}

/**
 * Product-local preprocessing keeps ordinary code fences and their shared renderer.
 * @param {{ siteRoot: string; version: string }} options
 * @returns {import('vite').Plugin}
 */
export function releaseCodeMdx({ siteRoot, version }) {
  assert.match(version, versionPattern, 'Release examples require an explicit version')
  const root = resolve(siteRoot)
  return {
    name: 'master-css-release-examples',
    enforce: 'pre',
    transform(source, id) {
      const file = id.split('?', 1)[0]
      if (!file.endsWith('.mdx') || file.startsWith('\0')) return
      const path = relative(root, resolve(file))
      if (isAbsolute(path) || path === '..' || path.startsWith('..' + sep) || resolve(file) === root) return
      const code = releaseCode(source, version)
      if (code !== source) return { code, map: null }
    }
  }
}
