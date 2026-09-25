import { readFileSync } from 'node:fs'
import path from 'node:path'
import { compileManifestSync } from '@master/css-compiler/node'
import { createRenderSessionSync } from '@master/css/node'
import { escape } from './html'
import preset from '../../../utils/preset-manifest'
import type { DemoScene, ReferenceDemoSection } from './types'

const siteRoot = path.basename(process.cwd()) === 'site' ? process.cwd() : path.join(process.cwd(), 'site')
const tokenFile = path.join(siteRoot, 'styles/demo.css')
const frameFile = path.join(siteRoot, 'components/demo/reference/frame.css')
let tokens = readFileSync(tokenFile, 'utf8').split('@layer components')[0]
const frameCSS = readFileSync(frameFile, 'utf8')
let shared = compileManifestSync(`@mode light { .light { @slot; } }\n@mode dark { .dark { @slot; } }\n${tokens}`, { baseManifest: preset }).manifest

export function demoDocument(section: ReferenceDemoSection, scene: DemoScene) {
  // A srcdoc inherits the host URL as its base. Keep native fragment navigation
  // inside this preview without changing the base for images, fonts or links.
  const html = scene.html.replace(/(<a\b[^>]*?\bhref=)(["'])#([^"']*)\2/g, '$1$2about:srcdoc#$3$2')
  // These files are read assets, so development HMR does not invalidate them.
  const developing = process.env.NODE_ENV === 'development'
  if (developing) {
    const nextTokens = readFileSync(tokenFile, 'utf8').split('@layer components')[0]
    if (nextTokens !== tokens) {
      tokens = nextTokens
      shared = compileManifestSync(`@mode light { .light { @slot; } }\n@mode dark { .dark { @slot; } }\n${tokens}`, { baseManifest: preset }).manifest
    }
  }
  const configuration = [section.css, scene.css].filter(Boolean).join('\n')
  const compiled = configuration ? compileManifestSync(configuration, { baseManifest: shared }) : undefined
  const errors = compiled?.diagnostics.filter(item => item.severity === 'error') ?? []
  if (errors.length) throw new Error(`${section.page}#${section.id}: ${JSON.stringify(errors)}`)
  const engine = createRenderSessionSync({ manifest: compiled?.manifest ?? shared })
  try {
    const classNames = [...new Set([...`${scene.html}<body class="${scene.bodyClass ?? ''}">`.matchAll(/\bclass="([\s\S]*?)"/g)].flatMap(match => match[1].replaceAll('&quot;', '"').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').split(/\s+/)).filter(Boolean))]
    const tokenClasses = ['bg-demo-canvas', 'bg-demo-surface', 'fg-demo-text', 'fg-demo-muted', 'fg-demo-blue', 'fg-demo-violet', 'fg-demo-amber', 'fg-demo-neutral', 'b-demo-line', 'bg-demo-grid', 'font-sans', 'font-mono']
    const rendered = engine.ensureClassRules([...classNames, ...tokenClasses])
    const invalid = rendered.invalidClassNames.filter(value => classNames.includes(value) && !compiled?.nativeClassNames.includes(value))
    if (invalid.length) throw new Error(`${section.page}#${section.id}: invalid demo classes ${invalid.join(', ')}`)
    const css = `${developing ? readFileSync(frameFile, 'utf8') : frameCSS}\n${compiled?.css ?? ''}\n${rendered.cssText}`
    return `<!doctype html><html lang="en" class="light"${scene.motion ? ' data-demo-paused' : ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${scene.head ?? ''}<style>@layer theme,base,defaults,components,utilities;${css.replaceAll('</style', '<\\/style')}</style></head><body${scene.bodyClass ? ` class="${escape(scene.bodyClass)}"` : ''}>${html}</body></html>`
  } finally { engine.dispose() }
}
