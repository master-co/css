import { statSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const siteRoot = fileURLToPath(new URL('..', import.meta.url))
const publicRoot = path.join(siteRoot, 'public')
const outputRoot = path.join(siteRoot, 'out')
const assetDirs = ['images', 'icons', 'fonts'] as const
const ignoredDirs = new Set(['node_modules', '.next', '.generated', '.wrangler', '.open-next', '.turbo', '.master', 'out', 'test-results', 'public'])
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mdx', '.css'])
const sourceAsset = /['"`]((?:(?:~\/site\/|(?:\.\.\/)+)public\/|\/)?(?:images|icons|fonts)\/[^'"`\s<>${}]+)['"`]/g
const outputAttribute = /\b(?:src|href|poster|srcset)=(['"])(.*?)\1/gi
const cssUrl = /url\(\s*['"]?([^\)'"\s]+)['"]?\s*\)/gi
const used = new Set<string>()
const missing = new Set<string>()

for (const file of await listFiles(siteRoot, ignoredDirs)) {
  if (!sourceExtensions.has(path.extname(file)) || file.includes('.test.') || file.includes('.spec.') || file.endsWith('verify-public-assets.ts')) continue
  const content = await readFile(file, 'utf8')
  for (const [, value] of content.matchAll(sourceAsset)) {
    check(value, file, publicRoot)
  }
}

// The injected font-face CSS is a public asset and also references other font files.
const fontCss = path.join(publicRoot, 'fonts/index.css')
for (const [, value] of (await readFile(fontCss, 'utf8')).matchAll(cssUrl)) {
  check(value, fontCss, publicRoot)
}

for (const file of await listFiles(outputRoot)) {
  const extension = path.extname(file)
  if (extension !== '.html' && extension !== '.css') continue
  const content = await readFile(file, 'utf8')
  if (extension === '.html') {
    for (const [, , attribute] of content.matchAll(outputAttribute)) {
      for (const value of attribute.split(',')) check(value.trim().split(/\s+/)[0], file, outputRoot)
    }
  }
  for (const [, value] of content.matchAll(cssUrl)) check(value, file, outputRoot)
}

const unreferenced: string[] = []
for (const dir of assetDirs) {
  for (const file of await listFiles(path.join(publicRoot, dir))) {
    const asset = path.relative(publicRoot, file).split(path.sep).join('/')
    if (!used.has(asset)) unreferenced.push(asset)
  }
}

if (missing.size || unreferenced.length) {
  for (const finding of [...missing].sort()) console.error(`Missing public asset: ${finding}`)
  for (const finding of unreferenced.sort()) console.error(`Unreferenced public asset: ${finding}`)
  process.exitCode = 1
} else {
  console.log(`Verified ${used.size} referenced public assets; no missing or unreferenced files.`)
}

function check(raw: string, source: string, root: string) {
  const normalized = raw.replaceAll('&amp;', '&').replaceAll('\\/', '/')
  const withoutPublic = normalized.replace(/^(?:~\/site\/|(?:\.\.\/)+)public\//, '')
  const asset = withoutPublic.replace(/^\//, '').split(/[?#]/, 1)[0]
  if (!/^(?:images|icons|fonts)\//.test(asset) || asset.includes('*')) return
  let decoded: string
  try {
    decoded = decodeURIComponent(asset)
  } catch {
    missing.add(`${source}: ${raw}`)
    return
  }
  used.add(decoded)
  if (!path.resolve(root, decoded).startsWith(path.resolve(root) + path.sep)) {
    missing.add(`${source}: ${raw}`)
    return
  }
  if (!isFile(path.join(root, decoded))) missing.add(`${source}: ${decoded}`)
}

function isFile(file: string) {
  try {
    return statSync(file).isFile()
  } catch {
    return false
  }
}

async function listFiles(root: string, ignored = new Set<string>()): Promise<string[]> {
  const files: string[] = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue
    const file = path.join(root, entry.name)
    if (entry.isDirectory()) files.push(...await listFiles(file, ignored))
    else if (entry.isFile()) files.push(file)
  }
  return files
}
