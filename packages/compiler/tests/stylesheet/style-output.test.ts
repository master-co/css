import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  compileCSSManifest,
  createManifestFromCSSResult,
  resolveMasterCSSPackageImportGraph
} from '../../src/node-compiler'
import { MasterCSSScanner } from '../helpers/scanner'
import {
  compileStylesheet,
  compileRenderedStylesheet,
  createStyleEntryEmittedGlobals,
  createStylesheetHostSource,
  createMasterCSSPackageHostSource,
  createExtractedCSS,
  createExtractedCSSResult,
  collectStylesheetDependencies,
  cleanStyleRequest,
  getNativeCSS,
  hasPreserveNativeDirective,
  hasMasterStyleEntrypoint,
  hasLocalStyleDirectives,
  isMasterStyleSource,
  isStylesheetRequest,
  removeMasterStyleDirectives,
  removeStylesheetImports,
  registerStylesheetSource,
  resolveMasterStyleSource,
  resolveStylesheetImportGraph,
  replaceStylesheetImports,
  transformLocalStylesheet
} from '../../src/stylesheet'
import { renderCompiledManifestCSS } from '../../src/stylesheet/render'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'master-css-stylesheet-'))
  mkdirSync(join(root, 'app'), { recursive: true })
  return root
}

describe('style CSS extraction helpers', () => {
  it('removes top-level master style directives', () => {
    const result = removeMasterStyleDirectives([
      '@source "./page.tsx";',
      '@safelist "card";',
      '@blocklist "debug-*";',
      '@preserve native;',
      '@master entry;',
      '',
      '@media (min-width: 768px) {',
      '    @preserve native;',
      '}',
      '',
      '.card { color: red; }'
    ].join('\n'))

    expect(hasMasterStyleEntrypoint('@master entry;\n.card { color: red; }')).toBe(true)
    expect(result.removed).toBe(true)
    expect(result.code).not.toContain('@source')
    expect(result.code).not.toContain('@safelist')
    expect(result.code).not.toContain('@blocklist')
    expect(result.code).not.toContain('@preserve native;\n@master')
    expect(result.code).toContain('@media (min-width: 768px) {\n    @preserve native;\n}')
  })

  it('treats an empty host source as an intentionally handled Master CSS import', () => {
    const result = createStylesheetHostSource('@import "@master/css";', {
      masterSource: ''
    })

    expect(result).toBe('')
  })

  it('keeps native imports before generated host CSS', () => {
    const masterFirst = createStylesheetHostSource([
      '@import "@master/css";',
      '@import "@fontsource/fira-mono";',
      '',
      '.card { color: red; }'
    ].join('\n'), {
      masterSource: '#master-css-slot{--slot:0}'
    })
    const masterLast = createStylesheetHostSource([
      '@import "@fontsource/fira-mono";',
      '@import "@master/css";',
      '',
      '.card { color: red; }'
    ].join('\n'), {
      masterSource: '#master-css-slot{--slot:0}'
    })

    expect(masterFirst).toBe('@import "@fontsource/fira-mono";\n#master-css-slot{--slot:0}')
    expect(masterLast).toBe('@import "@fontsource/fira-mono";\n#master-css-slot{--slot:0}')
  })

  it('preserves native import modifiers before generated host CSS', () => {
    const result = createStylesheetHostSource([
      '@import url("@fontsource/fira-mono") layer(fonts) screen;',
      '@import "normalize.css" layer(reset);',
      '@import "@master/css";'
    ].join('\n'), {
      masterSource: '#master-css-slot{--slot:0}'
    })

    expect(result).toBe([
      '@import url("@fontsource/fira-mono") layer(fonts) screen;',
      '@import "normalize.css" layer(reset);',
      '#master-css-slot{--slot:0}'
    ].join('\n'))
  })

  it('uses the managed CSS entry config and native CSS sources', async () => {
    const root = createFixture()
    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()

    const stylesheetSources = new Map()
    await registerStylesheetSource(scanner, stylesheetSources, join(root, 'app/globals.css'), `
      @import "@master/css";

      @theme {
        --color-primary: #ff0000;
        --animation-main: scale 1s;
      }

      @keyframes fade {
        from {
          opacity: 0;
        }

        to {
          opacity: 1;
        }
      }

      @layer components {
        .btn {
          display: grid;
        }
      }

      .main {
        color: var(--color-primary);
        animation-name: fade;
      }

      .unused {
        color: var(--color-primary);
      }
    `, { baseManifest: defaultManifest })
    await scanner.scan(join(root, 'app/page.tsx'), '<main class="btn block main fg:red"></main>')

    const css = await createExtractedCSS({
      scanner,
      stylesheetSources,
      baseManifest: defaultManifest,
      projectDir: root
    })

    expect(css).toContain('@layer base')
    expect(css).toContain('text-rendering: geometricprecision')
    expect(css).toContain('.main')
    expect(css).not.toContain('.unused')
    expect(css).toContain('--color-primary:red')
    expect(css).toContain('--color-red')
    expect(css).toContain('@keyframes fade')
    expect(css.match(/@keyframes fade/g) || []).toHaveLength(1)
    expect(css).toContain('.btn')
    expect(css).toContain('display: grid')
    expect(css).toContain('.block{display:block}')
    expect(css).toContain('.fg\\:red{color:var(--color-red)}')
    expect(css).not.toContain('@master')
    expect(css).not.toContain('virtual:master-utilities.css')
    expect(css).not.toContain('@master/css')
  })

  it('keeps non-expandable native imports out of generated managed CSS', async () => {
    const root = createFixture()
    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()

    const stylesheetSources = new Map()
    await registerStylesheetSource(scanner, stylesheetSources, join(root, 'app/globals.css'), [
      '@import "@master/css";',
      '@import "@fontsource/fira-mono";',
      '',
      '.card {',
      '    color: red;',
      '}'
    ].join('\n'), { baseManifest: defaultManifest })
    await scanner.scan(join(root, 'app/page.html'), '<div class="card"></div>')

    const css = await createExtractedCSS({
      scanner,
      stylesheetSources,
      baseManifest: defaultManifest,
      projectDir: root
    })

    expect(css).toContain('.card')
    expect(css).not.toContain('@fontsource/fira-mono')
    expect(css).not.toContain('@master/css')
  })

  it('reports emittedGlobals variables and animations emitted by the Master CSS entry', async () => {
    const root = createFixture()
    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()

    const stylesheetSources = new Map()
    await registerStylesheetSource(scanner, stylesheetSources, join(root, 'app/globals.css'), `
      @theme {
        --animation-main: scale 1s;
        --color-primary: #ff0000;

        @keyframes fade {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes slide {
          to {
            transform: translateX(1rem);
          }
        }

        @keyframes scale {
          to {
            transform: scale(1.1);
          }
        }
      }

      .main {
        color: var(--color-primary);
        animation-name: fade,slide;
      }

      .main-animated {
        animation: var(--animation-main);
      }
    `, { baseManifest: defaultManifest })
    await scanner.scan(join(root, 'app/page.tsx'), '<main class="main main-animated"></main>')

    const result = await createExtractedCSSResult({
      scanner,
      stylesheetSources,
      baseManifest: defaultManifest,
      projectDir: root,
      includeGeneratedCSS: false
    })

    expect(result.css).toContain('.main')
    expect(result.css).toContain('--color-primary:red')
    expect(result.css).toContain('@keyframes fade')
    expect(result.emittedGlobals).toEqual({
      variables: {
        'animation-main': 1,
        'color-primary': 1
      },
      animations: {
        fade: 1,
        scale: 1,
        slide: 1
      }
    })
  })

  it('does not preload inline theme tokens', async () => {
    const root = createFixture()
    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()

    const stylesheetSources = new Map()
    await registerStylesheetSource(scanner, stylesheetSources, join(root, 'app/globals.css'), `
      @theme inline {
        --color-primary: #ff0000;
      }
    `, { baseManifest: defaultManifest })
    await scanner.scan(join(root, 'app/page.tsx'), '<main class="fg:primary"></main>')

    const result = await createExtractedCSSResult({
      scanner,
      stylesheetSources,
      baseManifest: defaultManifest,
      projectDir: root
    })

    expect(result.css).toContain('.fg\\:primary{color:red}')
    expect(result.css).not.toContain('--color-primary')
    expect(result.emittedGlobals.variables).toEqual({})
  })

  it('emits static theme tokens and keyframes without class references', async () => {
    const root = createFixture()
    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()

    const stylesheetSources = new Map()
    await registerStylesheetSource(scanner, stylesheetSources, join(root, 'app/globals.css'), `
      @theme static {
        --color-primary: #ff0000;

        @keyframes static-fade {
          to {
            opacity: 1;
          }
        }
      }
    `, { baseManifest: defaultManifest })

    const result = await createExtractedCSSResult({
      scanner,
      stylesheetSources,
      baseManifest: defaultManifest,
      projectDir: root,
      includeGeneratedCSS: false
    })

    expect(result.css).toContain('@layer theme')
    expect(result.css).toContain('--color-primary:red')
    expect(result.css).toContain('@keyframes static-fade')
    expect(result.emittedGlobals).toEqual({
      variables: {
        'color-primary': 1
      },
      animations: {
        'static-fade': 1
      }
    })
  })

  it('prunes local CSS imports from Master CSS import roots by default', async () => {
    const root = createFixture()
    mkdirSync(join(root, 'app/styles'), { recursive: true })
    writeFileSync(join(root, 'app/styles/btn.css'), `
      .btn-native {
        color: red;
      }

      .btn-unused {
        color: blue;
      }
    `)
    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()

    const stylesheetSources = new Map()
    const result = await registerStylesheetSource(scanner, stylesheetSources, join(root, 'app/globals.css'), `
      @import "@master/css";
      @import "./styles/btn.css";

      .card {
        display: grid;
      }

      .unused {
        display: block;
      }
    `, { baseManifest: defaultManifest })
    await scanner.scan(join(root, 'app/page.html'), '<div class="card btn-native"></div>')

    const css = await createExtractedCSS({
      scanner,
      stylesheetSources,
      baseManifest: defaultManifest,
      projectDir: root
    })

    expect(result.dependencies).toContain(join(root, 'app/globals.css'))
    expect(result.dependencies).toContain(join(root, 'app/styles/btn.css'))
    expect(result.dependencies.filter((dependency: string) => !dependency.startsWith(root)).length).toBeGreaterThan(0)
    expect(css).toContain('.card')
    expect(css).toContain('.btn-native')
    expect(css).not.toContain('.unused')
    expect(css).not.toContain('.btn-unused')
    expect(css).not.toContain('@import "./styles/btn.css"')
  })

  it('preserves native CSS when a Master CSS import root opts out of pruning', async () => {
    const root = createFixture()
    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()

    const stylesheetSources = new Map()
    await registerStylesheetSource(scanner, stylesheetSources, join(root, 'app/globals.css'), `
      @import "@master/css";
      @preserve native;

      .card {
        display: grid;
      }

      .unused {
        display: block;
      }
    `, { baseManifest: defaultManifest })
    await scanner.scan(join(root, 'app/page.html'), '<div class="card"></div>')

    const css = await createExtractedCSS({
      scanner,
      stylesheetSources,
      baseManifest: defaultManifest,
      projectDir: root
    })

    expect([...scanner.nativeClassNames]).toEqual([])
    expect([...scanner.usedNativeClasses]).toEqual([])
    expect(css).toContain('.card')
    expect(css).toContain('.unused')
    expect(css).not.toContain('@preserve native')
  })

  it('preserves imported native CSS when a root graph opts out of pruning', async () => {
    const root = createFixture()
    mkdirSync(join(root, 'app/styles'), { recursive: true })
    writeFileSync(join(root, 'app/styles/btn.css'), `
      .btn-native {
        color: red;
      }

      .btn-unused {
        color: blue;
      }
    `)
    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()

    const stylesheetSources = new Map()
    await registerStylesheetSource(scanner, stylesheetSources, join(root, 'app/globals.css'), `
      @import "@master/css";
      @preserve native;
      @import "./styles/btn.css";
    `, { baseManifest: defaultManifest })
    await scanner.scan(join(root, 'app/page.html'), '<div class="btn-native"></div>')

    const css = await createExtractedCSS({
      scanner,
      stylesheetSources,
      baseManifest: defaultManifest,
      projectDir: root
    })

    expect([...scanner.nativeClassNames]).toEqual([])
    expect(css).toContain('.btn-native')
    expect(css).toContain('.btn-unused')
    expect(css).not.toContain('@preserve native')
  })

  it('can emit pruned native CSS without generated Master CSS', async () => {
    const root = createFixture()
    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()

    const stylesheetSources = new Map()
    await registerStylesheetSource(scanner, stylesheetSources, join(root, 'app/globals.css'), `
      @master entry;

      .card {
        display: grid;
      }
    `, { baseManifest: defaultManifest })
    await scanner.scan(join(root, 'app/page.html'), '<div class="card block"></div>')

    const css = await createExtractedCSS({
      scanner,
      stylesheetSources,
      baseManifest: defaultManifest,
      projectDir: root,
      includeGeneratedCSS: false
    })

    expect(css).toContain('.card')
    expect(css).not.toContain('@layer base')
    expect(css).not.toContain('text-rendering: geometricprecision')
    expect(css).not.toContain('.block{display:block}')
  })

  it('keeps package base CSS without generated utilities for Master CSS imports', async () => {
    const root = createFixture()
    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()

    const stylesheetSources = new Map()
    await registerStylesheetSource(
      scanner,
      stylesheetSources,
      join(root, 'app/globals.css'),
      '@import "@master/css";',
      { baseManifest: defaultManifest }
    )
    await scanner.scan(join(root, 'app/page.html'), '<div class="block"></div>')

    const css = await createExtractedCSS({
      scanner,
      stylesheetSources,
      baseManifest: defaultManifest,
      projectDir: root,
      includeGeneratedCSS: false
    })

    expect(css).toContain('@layer base')
    expect(css).toContain('text-rendering: geometricprecision')
    expect(css).toMatch(/font-family:\s*var\(--font-family-sans\)/)
    expect(css).not.toContain('.block{display:block}')
    expect(css).not.toContain('@master/css')
  })

  it('returns empty CSS when generated output is disabled without style sources', async () => {
    const root = createFixture()
    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()
    await scanner.scan(join(root, 'app/page.html'), '<div class="block"></div>')

    const css = await createExtractedCSS({
      scanner,
      baseManifest: defaultManifest,
      includeGeneratedCSS: false
    })

    expect(css).toBe('')
  })
})
