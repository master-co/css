import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MasterCSSScanner } from '../helpers/scanner'
import { collectStylesheetDirectives, removeStylesheetDirectiveStatements } from '../../src/stylesheet/directives'
import {
  createExtractedCSS,
  registerStylesheetSource
} from '../../src/stylesheet'

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'master-css-stylesheet-directives-'))
  mkdirSync(join(root, 'app/a'), { recursive: true })
  mkdirSync(join(root, 'app/b'), { recursive: true })
  return root
}

describe('stylesheet CSS directives', () => {
  it('reads directive modifiers outside quoted strings', () => {
    const root = createFixture()
    const directives = collectStylesheetDirectives(`
      @source './exclude/**/*.tsx';
      @source not './src/**/*.test.tsx';
      @safelist 'not-exclude';
      @blocklist 'legacy-*';
      @preserve native;
    `, join(root, 'app/entry.css'), root)

    expect(directives.include).toEqual(['app/exclude/**/*.tsx'])
    expect(directives.exclude).toEqual(['app/src/**/*.test.tsx'])
    expect(directives.safelist).toEqual(['not-exclude'])
    expect(directives.blocklist[0]).toBeInstanceOf(RegExp)
    expect((directives.blocklist[0] as RegExp).test('legacy-card')).toBe(true)
    expect(directives.preserveNative).toBe(true)
  })

  it('does not collect non-entry @master at-rules as extraction directives', () => {
    const source = `
      @master source './src/**/*.tsx';
      @master source exclude './src/**/*.test.tsx';
      @master source force './src/generated.tsx';
      @master class 'not-exclude';
      @master class exclude 'legacy-*';
      @master no-shake;
    `
    const directives = collectStylesheetDirectives(source)
    const result = removeStylesheetDirectiveStatements(source)

    expect(directives).toEqual({
      include: [],
      exclude: [],
      safelist: [],
      safelistKeyframes: [],
      blocklist: [],
      preserveNative: false,
      pruneNative: false
    })
    expect(result.removed).toBe(false)
    expect(result.code).toContain('@master source')
    expect(result.code).toContain('@master class')
    expect(result.code).toContain('@master no-shake')
  })

  it('loads scanner directives from a managed CSS entry graph', async () => {
    const root = createFixture()
    writeFileSync(join(root, 'app/page.tsx'), "<div class=\"display:block\"></div>")
    writeFileSync(join(root, 'app/skip.test.tsx'), "<div class=\"text-align:center\"></div>")
    writeFileSync(join(root, 'app/forced.test.tsx'), '<div class="fg-red"></div>')

    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()
    const stylesheetSources = new Map()
    await registerStylesheetSource(scanner, stylesheetSources, join(root, 'app/entry.css'), "\n      @import \"@master/css\";\n      @source './**/*.tsx';\n      @source not './**/*.test.tsx';\n      @safelist 'font-weight-semibold legacy-token';\n      @blocklist 'legacy-*';\n    ", { baseManifest: scanner.css.manifest })
    const css = await createExtractedCSS({
      scanner,
      stylesheetSources,
      baseManifest: scanner.css.manifest,
      projectDir: root
    })

    expect(css).toContain(".display\\:block{display:block}")
    expect(css).toContain('.font-weight-semibold{font-weight:var(--font-weight-semibold)}')
    expect(css).not.toContain('.fg-red')
    expect(css).not.toContain('.text\\:center')
    expect(css).not.toContain('legacy-token')
  })

  it('loads source directives from server template extensions', async () => {
    const root = createFixture()
    mkdirSync(join(root, 'app/templates'), { recursive: true })
    writeFileSync(join(root, 'app/templates/product.liquid'), "<h1 class=\"display:block\"></h1>")
    writeFileSync(join(root, 'app/templates/index.cshtml'), "<h1 class=\"margin:0\"></h1>")
    writeFileSync(join(root, 'app/templates/show.erb'), '<h1 class="font-weight-semibold"></h1>')

    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()
    const stylesheetSources = new Map()
    await registerStylesheetSource(scanner, stylesheetSources, join(root, 'app/entry.css'), "\n      @import \"@master/css\";\n      @source './templates/**/*.{liquid,cshtml,erb}';\n    ", { baseManifest: scanner.css.manifest })
    const css = await createExtractedCSS({
      scanner,
      stylesheetSources,
      baseManifest: scanner.css.manifest,
      projectDir: root
    })

    expect(css).toContain(".display\\:block{display:block}")
    expect(css).toContain(".margin\\:0{margin:0}")
    expect(css).toContain('.font-weight-semibold{font-weight:var(--font-weight-semibold)}')
  })

  it('unions source directives and subtracts source not directives', async () => {
    const root = createFixture()
    writeFileSync(join(root, 'app/a/page.tsx'), "<div class=\"display:block\"></div>")
    writeFileSync(join(root, 'app/b/page.tsx'), "<div class=\"margin:0\"></div>")
    writeFileSync(join(root, 'app/a/skip.tsx'), '<div class="fg-red"></div>')
    writeFileSync(join(root, 'app/b/skip.tsx'), '<div class="text:center"></div>')

    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()
    const stylesheetSources = new Map()
    await registerStylesheetSource(scanner, stylesheetSources, join(root, 'app/entry.css'), "\n      @import \"@master/css\";\n      @source './a/*.tsx';\n      @source './b/*.tsx';\n      @source not './a/skip.tsx';\n      @source not './b/skip.tsx';\n    ", { baseManifest: scanner.css.manifest })
    const css = await createExtractedCSS({
      scanner,
      stylesheetSources,
      baseManifest: scanner.css.manifest,
      projectDir: root
    })

    expect(css).toContain(".display\\:block{display:block}")
    expect(css).toContain(".margin\\:0{margin:0}")
    expect(css).not.toContain('.fg-red')
    expect(css).not.toContain('.text\\:center')
  })

  it('uses stylesheet-local source directives for a pruned CSS root', async () => {
    const root = createFixture()
    writeFileSync(join(root, 'app/a/page.tsx'), '<div class="card"></div>')
    writeFileSync(join(root, 'app/b/page.tsx'), '<div class="unused"></div>')
    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()

    const stylesheetSources = new Map()
    const result = await registerStylesheetSource(scanner, stylesheetSources, join(root, 'app/a/a.css'), `
      @import "@master/css";
      @source './*.tsx';
      @prune native;

      .card {
        color: red;
      }

      .unused {
        color: blue;
      }
    `, { baseManifest: scanner.css.manifest })

    const css = await createExtractedCSS({
      scanner,
      stylesheetSources,
      baseManifest: scanner.css.manifest,
      includeGeneratedCSS: false,
      projectDir: root
    })

    expect(result.dependencies).toContain(join(root, 'app/a/page.tsx'))
    expect(css).toContain('.card')
    expect(css).not.toContain('.unused')
  })

  it('merges imported stylesheet class directives into the parent root scope', async () => {
    const root = createFixture()
    writeFileSync(join(root, 'app/shared.css'), `
      @prune native;
      @safelist 'shared-card legacy-card';
      @blocklist 'legacy-*';

      .shared-card {
        color: red;
      }

      .legacy-card {
        color: blue;
      }
    `)
    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()

    const stylesheetSources = new Map()
    await registerStylesheetSource(scanner, stylesheetSources, join(root, 'app/a/a.css'), `
      @import "@master/css";
      @import '../shared.css';
    `, { baseManifest: scanner.css.manifest })

    const css = await createExtractedCSS({
      scanner,
      stylesheetSources,
      baseManifest: scanner.css.manifest,
      includeGeneratedCSS: false,
      projectDir: root
    })

    expect(css).toContain('.shared-card')
    expect(css).not.toContain('.legacy-card')
    expect(css).not.toContain('@safelist')
  })
})


it('resolves every relative source against its declaring file and preserves source-only metadata', () => {
  const source = '@source "views/*.html"; @source not "../generated/*.html";'
  expect(collectStylesheetDirectives(source).include).toEqual(['views/*.html'])
  const resolved = collectStylesheetDirectives(source, 'styles/entry.css', '/workspace')
  expect(resolved.include).toEqual(['styles/views/*.html'])
  expect(resolved.exclude).toEqual(['generated/*.html'])
  for (const id of ['\0virtual:entry.css', 'virtual:entry.css', 'https://example.test/entry.css']) {
    expect(() => collectStylesheetDirectives(source, id, '/workspace')).toThrow('file or baseFile')
  }
})
