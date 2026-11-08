import { createRequire } from 'node:module'
import { join } from 'node:path'
import type { ResolvedConfig } from 'vite'

/** The part of lightningcss `transform` used here; Vite owns the dependency. */
interface LightningCSS {
  transform(options: Record<string, unknown>): { code: Uint8Array, warnings: { message: string, loc: { line: number, column: number } }[] }
}
type ESBuild = { transformSync(code: string, options: Record<string, unknown>): { code: string, warnings: { text: string }[] } }

export interface FinalizedCSS {
  css: string
  warnings: string[]
}

export type CSSFinalizer = (css: string, filename: string) => FinalizedCSS

/**
 * Production stylesheet entries reach Vite as an internal slot rule; Master CSS
 * splices the real CSS in after Vite's CSS pipeline has run. These mirror the
 * lowering of `css.transformer: 'lightningcss'` and the `build.cssMinify` step of
 * Vite's `finalizeCss`, with the same targets, for the spliced bytes.
 */
export function createCSSFinalizer(config: Pick<ResolvedConfig, 'root' | 'css' | 'esbuild'> & { build?: Pick<ResolvedConfig['build'], 'cssMinify' | 'cssTarget'> }): CSSFinalizer | undefined {
  const { cssMinify, cssTarget } = config.build ?? {}
  const lower = config.css?.transformer === 'lightningcss'
  if (!cssMinify && !lower) return
  const require = viteRequire(config.root)
  const lightningcss = () => require('lightningcss') as LightningCSS
  const options = config.css?.lightningcss ?? {}
  const targets = convertTargets(cssTarget)
  const lightning = (css: string, filename: string, minify: boolean, warnings: string[]) => {
    const { code, warnings: messages } = lightningcss().transform({
      ...options,
      // Invalid rules are dropped as a browser would drop them, with a warning,
      // instead of failing a build that shipped them before.
      errorRecovery: options.errorRecovery ?? true,
      targets,
      filename,
      code: Buffer.from(css),
      minify,
      cssModules: undefined,
      ...minify ? { visitor: undefined, customAtRules: undefined } : {}
    })
    for (const warning of messages) warnings.push(`[lightningcss${minify ? ' minify' : ''}] ${filename}:${warning.loc.line}:${warning.loc.column} ${warning.message}`)
    return Buffer.from(code).toString()
  }
  return (source, filename) => {
    const warnings: string[] = []
    let css = source
    // A lightningcss minify pass lowers with the same targets; only custom
    // visitors, which Vite runs per module and not while minifying, need their own pass.
    if (lower && (options.visitor || (cssMinify !== true && cssMinify !== 'lightningcss'))) css = lightning(css, filename, false, warnings)
    if (cssMinify === 'esbuild') {
      const { code, warnings: messages } = (require('esbuild') as ESBuild).transformSync(css, {
        loader: 'css', target: cssTarget || undefined, sourcefile: filename, ...esbuildMinifyOptions(config.esbuild || {})
      })
      for (const warning of messages) warnings.push(`[esbuild css minify] ${filename}: ${warning.text}`)
      css = code
    } else if (cssMinify) {
      css = lightning(css, filename, true, warnings)
    }
    return { css, warnings }
  }
}

/** Load Vite's own CSS tools: the ones its `minifyCSS` would use for this project. */
function viteRequire(root: string) {
  const local = createRequire(join(root, 'package.json'))
  let vite: string
  try {
    vite = local.resolve('vite/package.json')
  } catch {
    vite = createRequire(import.meta.url).resolve('vite/package.json')
  }
  const fromVite = createRequire(vite)
  return (id: string) => {
    try {
      return fromVite(id)
    } catch {
      return local(id)
    }
  }
}

function esbuildMinifyOptions(options: Exclude<ResolvedConfig['esbuild'], false>) {
  const base = { charset: options.charset, logLevel: options.logLevel, logLimit: options.logLimit, logOverride: options.logOverride, legalComments: options.legalComments }
  return options.minifyIdentifiers != null || options.minifySyntax != null || options.minifyWhitespace != null
    ? { ...base, minifyIdentifiers: options.minifyIdentifiers ?? true, minifySyntax: options.minifySyntax ?? true, minifyWhitespace: options.minifyWhitespace ?? true }
    : { ...base, minify: true }
}

// Vite's `convertTargets` (vite/src/node/plugins/css.ts), which it does not export.
const browsers: Record<string, string | false> = { chrome: 'chrome', edge: 'edge', firefox: 'firefox', hermes: false, ie: 'ie', ios: 'ios_saf', node: false, opera: 'opera', rhino: false, safari: 'safari' }
const esYears: Record<number, string> = {
  2015: 'chrome49 edge13 safari10 ios10 firefox44 opera36',
  2016: 'chrome50 edge13 safari10 ios10 firefox43 opera37',
  2017: 'chrome58 edge15 safari11 ios11 firefox52 opera45',
  2018: 'chrome63 edge79 safari12 ios12 firefox58 opera50',
  2019: 'chrome73 edge79 safari12.1 ios12.1 firefox64 opera60',
  2020: 'chrome80 edge80 safari14.1 ios14.5 firefox80 opera67',
  2021: 'chrome85 edge85 safari14.1 ios14.5 firefox80 opera71',
  2022: 'chrome94 edge94 safari16.4 ios16.4 firefox93 opera80',
  2023: 'chrome110 edge110 safari16.4 ios16.4 firefox146 opera96',
  2024: 'chrome119 edge119 safari17.4 ios17.4 firefox145 opera105',
  2025: 'chrome136 edge136 safari26.0 ios26.0 firefox138 opera121'
}

export function convertTargets(target: string | string[] | false | undefined): Record<string, number> | undefined {
  if (!target) return
  const targets: Record<string, number> = {}
  const entries = [target].flat().flatMap((entry) => {
    const match = /es(6|\d{4})/.exec(entry)
    if (!match) return entry
    const year = match[1] === '6' ? 2015 : Number(match[1])
    if (!esYears[year]) throw new Error(`Unsupported target "${entry}"`)
    return esYears[year].split(' ')
  })
  for (const entry of entries) {
    if (entry === 'esnext') continue
    const index = entry.search(/\d/)
    const browser = index >= 0 ? browsers[entry.slice(0, index)] : undefined
    if (browser === false) continue
    const [major, minor = 0] = index >= 0 ? entry.slice(index).split('.').map(value => parseInt(value, 10)) : [NaN]
    if (!browser || isNaN(major) || isNaN(minor)) throw new Error(`Unsupported target "${entry}"`)
    const version = major << 16 | minor << 8
    if (!targets[browser] || version < targets[browser]) targets[browser] = version
  }
  return Object.keys(targets).length ? targets : undefined
}
