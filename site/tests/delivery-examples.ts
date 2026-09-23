import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { compileRenderedStylesheet } from '@master/css-compiler/stylesheet'
import preset from '../utils/preset-manifest'

export const deliverySlugs = ['rendering-modes', 'scanning-latent-classes', 'native-css-pruning', 'route-level-styles'] as const
export const siteRoot = fileURLToPath(new URL('..', import.meta.url))

export function deliverySource(slug: string) {
  return readFileSync(join(siteRoot, `app/[locale]/guide/${slug}/content.mdx`), 'utf8')
}

export function deliverySection(slug: string, heading: string) {
  const source = deliverySource(slug)
  const start = source.indexOf(`## ${heading}\n`)
  if (start < 0) throw new Error(`Missing section ${slug}: ${heading}`)
  const end = source.indexOf('\n## ', start + 4)
  return source.slice(start, end < 0 ? undefined : end)
}

export function deliveryFences(source: string) {
  return [...source.matchAll(/```(\w+)([^\n]*)\n([\s\S]*?)```/g)].map(match => ({
    language: match[1], name: match[2].trim().replace(/^name=/, '').replace(/^"|"$/g, ''), text: match[3]
  }))
}

export function deliveryFixture() {
  const root = mkdtempSync(join(tmpdir(), 'master-delivery-source-'))
  symlinkSync(join(siteRoot, 'node_modules'), join(root, 'node_modules'), 'dir')
  return {
    root,
    write(name: string, source: string) {
      const file = join(root, name)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, source)
      return file
    },
    dispose() { rmSync(root, { recursive: true, force: true }) }
  }
}

/** Compile the authored local CSS with its actual @reference file. */
export async function routeStyles() {
  const fixture = deliveryFixture()
  try {
    const fences = deliveryFences(deliverySource('route-level-styles'))
    fixture.write('app/globals.css', fences.find(f => f.name === 'app/globals.css')!.text)
    const source = fences.filter(f => f.name === 'app/home/home.css').map(f => f.text).join('\n')
    const file = fixture.write('app/home/home.css', source)
    const result = await compileRenderedStylesheet(file, source, { baseManifest: preset, projectDir: fixture.root, preserveNativeCSS: true })
    if (result.diagnostics.some(d => d.severity === 'error')) throw new Error(JSON.stringify(result.diagnostics))
    return result.css
  } finally { fixture.dispose() }
}
