import { MasterCSSScanner } from './test-scanner'
import { describe, test, expect } from 'vitest'
import path from 'node:path'

const SOURCE = 'foo.tsx'
const CONTENT = `<div className="bg:white fg:black m:2x">hi</div>`
const ROOT = path.join(path.parse(process.cwd()).root, 'project')

describe('content-hash cache (Phase A optimisation)', () => {
  test('scan(source, content) returns false on identical re-call', async () => {
    const ex = await new MasterCSSScanner({}).init()
    const first = await ex.scan(SOURCE, CONTENT)
    const second = await ex.scan(SOURCE, CONTENT)
    expect(first).toBe(true)
    expect(second).toBe(false)
  })

  test('cache key is per-source — same content from a different source still inserts', async () => {
    const ex = await new MasterCSSScanner({}).init()
    const a = await ex.scan('a.tsx', CONTENT)
    const b = await ex.scan('b.tsx', CONTENT)
    expect(a).toBe(true)
    // b returns false because all classes are already in `validClasses`
    // from the first insert (different optimisation path), but the
    // content-hash entry for b.tsx is now set; a third call to b.tsx
    // would short-circuit on the hash.
    const bAgain = await ex.scan('b.tsx', CONTENT)
    expect(bAgain).toBe(false)
  })

  test('cache invalidates on content change', async () => {
    const ex = await new MasterCSSScanner({}).init()
    const v1 = await ex.scan(SOURCE, `<div class="bg:red">a</div>`)
    const v2 = await ex.scan(SOURCE, `<div class="bg:blue">b</div>`)
    expect(v1).toBe(true)
    expect(v2).toBe(true)
  })

  test('reset() clears the content-hash cache', async () => {
    const ex = await new MasterCSSScanner({}).init()
    await ex.scan(SOURCE, CONTENT)
    await ex.reset()
    // After reset, the hash for SOURCE is gone, so the same content
    // re-inserts (returns true again).
    const after = await ex.scan(SOURCE, CONTENT)
    expect(after).toBe(true)
  })
})

describe('Rust scanner validity cache', () => {
  test('same class across many files remains a single generated rule', async () => {
    const ex = await new MasterCSSScanner({}).init()
    // First file with the class — populates validClasses + the rules cache.
    await ex.scan('a.tsx', `<div className="bg:white">a</div>`)
    expect(ex.validClasses.has('bg:white')).toBe(true)
    await ex.scan('b.tsx', `<div className="bg:white">b</div>`)
    await ex.scan('c.tsx', `<div className="bg:white">c</div>`)
    expect(ex.state.engine.rules.filter(({ className }) => className === 'bg:white')).toHaveLength(1)
    expect(ex.state.cachedSources).toBe(3)
  })
})

describe('class exclusion matcher', () => {
  test('resets stateful regular expressions while filtering repeated classes', async () => {
    const ex = await new MasterCSSScanner({
      blocklist: [/^bg:/g]
    }).init()

    await ex.scan(SOURCE, `<div className="bg:red bg:blue block">hi</div>`)

    expect(ex.validClasses.has('bg:red')).toBe(false)
    expect(ex.validClasses.has('bg:blue')).toBe(false)
    expect(ex.validClasses.has('block')).toBe(true)
  })

  test('rebuilds when blocklist is reassigned', async () => {
    const ex = await new MasterCSSScanner({
      blocklist: [/^bg:/]
    }).init()

    await ex.scan('excluded.tsx', `<div className="bg:red block">hi</div>`)
    ex.options.blocklist = []
    await ex.scan('included.tsx', `<div className="bg:blue">hi</div>`)

    expect(ex.validClasses.has('bg:red')).toBe(false)
    expect(ex.validClasses.has('bg:blue')).toBe(true)
  })
})

describe('module source matcher cache', () => {
  test('scan() accepts trusted content without module filtering', async () => {
    const ex = await new MasterCSSScanner({ exclude: ['**/*.tsx'] }).init()

    expect(await ex.scan('component.tsx', `<div className="block">hi</div>`)).toBe(true)
    expect(ex.validClasses.has('block')).toBe(true)
  })

  test('normalizes query suffixes before matching module paths', async () => {
    const ex = await new MasterCSSScanner({}).init()

    expect(ex.isModuleAllowed('component.tsx?import')).toBe(true)
    expect(ex.isModuleAllowed('content.md?raw')).toBe(true)
  })

  test('rejects non-source extensions with Vite query suffixes', async () => {
    const ex = await new MasterCSSScanner({}).init()

    expect(ex.isModuleAllowed('data.json?import')).toBe(false)
    expect(ex.isModuleAllowed('icon.svg?url')).toBe(false)
    expect(ex.isModuleAllowed('audio.mp3')).toBe(false)
  })

  test('rejects framework style module requests', async () => {
    const ex = await new MasterCSSScanner({}).init()

    expect(ex.isModuleAllowed('App.vue?vue&type=script')).toBe(true)
    expect(ex.isModuleAllowed('App.vue?vue&type=style&index=0&lang.css')).toBe(false)
    expect(ex.isModuleAllowed('App.svelte?svelte&type=style&lang.css')).toBe(false)
  })

  test('rejects generated and cache dot directories by default', async () => {
    const ex = await new MasterCSSScanner({}, ROOT).init()

    for (const source of [
      'docs/.vitepress/cache/deps/vue.js?v=abc123',
      'docs/.vitepress/dist/app.js',
      '.vite/deps/vue.js?v=abc123',
      '.cache/storybook/preview.js',
      '.turbo/cache/app.ts',
      '.parcel-cache/index.js',
      '.nx/cache/project.ts',
      '.astro/content-modules.mjs',
      '.docusaurus/routes.js',
      '.output/server/index.mjs',
      '.vercel/output/functions/index.js',
      '.netlify/edge-functions/entry.js',
      '.wrangler/tmp/index.js',
      '.serverless/function.js',
      '.yarn/cache/package.js',
      '.pnpm-store/v3/files/index.js',
      '.npm/_cacache/index.js',
      '.bun/install/cache/index.js',
      '.git/hooks/pre-commit.js',
      '.hg/store/data.js',
      '.svn/tmp/index.js',
    ]) {
      expect(ex.isModuleAllowed(path.join(ROOT, source))).toBe(false)
    }
  })

  test('allows framework source files in dot directories by default', async () => {
    const ex = await new MasterCSSScanner({}, ROOT).init()

    expect(ex.isModuleAllowed(path.join(ROOT, 'docs/.vitepress/theme/index.ts'))).toBe(true)
    expect(ex.isModuleAllowed(path.join(ROOT, 'docs/.vitepress/theme/Layout.vue'))).toBe(true)
    expect(ex.isModuleAllowed(path.join(ROOT, '.storybook/preview.tsx'))).toBe(true)
  })

  test('matches absolute module ids against relative exclude globs within cwd', async () => {
    const ex = await new MasterCSSScanner({
      exclude: ['src/**/*.test.tsx']
    }, ROOT).init()

    expect(ex.isModuleAllowed(path.join(ROOT, 'src/App.tsx'))).toBe(true)
    expect(ex.isModuleAllowed(path.join(ROOT, 'src/App.test.tsx'))).toBe(false)
  })

  test('rebuilds module excludes when exclude is reassigned', async () => {
    const ex = await new MasterCSSScanner({
      exclude: ['src/**/*.test.tsx']
    }, ROOT).init()

    expect(ex.isModuleAllowed(path.join(ROOT, 'src/App.test.tsx'))).toBe(false)
    ex.options.exclude = []

    expect(ex.isModuleAllowed(path.join(ROOT, 'src/App.test.tsx'))).toBe(true)
  })

  test('strips query suffixes before matching absolute module ids against relative excludes', async () => {
    const ex = await new MasterCSSScanner({
      exclude: ['src/**/*.test.tsx']
    }, ROOT).init()

    expect(ex.isModuleAllowed(`${path.join(ROOT, 'src/App.test.tsx')}?import`)).toBe(false)
  })

  test('rejects absolute framework style module requests before exclude matching', async () => {
    const ex = await new MasterCSSScanner({
      exclude: []
    }, ROOT).init()

    expect(ex.isModuleAllowed(`${path.join(ROOT, 'src/App.vue')}?vue&type=script`)).toBe(true)
    expect(ex.isModuleAllowed(`${path.join(ROOT, 'src/App.vue')}?vue&type=style&index=0&lang.css`)).toBe(false)
  })

  test('scanModule() scans source-like allowed modules only', async () => {
    const ex = await new MasterCSSScanner({
      exclude: ['src/skip.tsx']
    }, ROOT).init()

    expect(await ex.scanModule(path.join(ROOT, 'src/App.tsx'), `<div className="block">hi</div>`)).toBe(true)
    expect(await ex.scanModule(path.join(ROOT, 'src/skip.tsx'), `<div className="fg:red">hi</div>`)).toBe(false)
    expect(await ex.scanModule(path.join(ROOT, 'src/data.json'), `<div className="bg:red">hi</div>`)).toBe(false)
    expect(ex.validClasses.has('block')).toBe(true)
    expect(ex.validClasses.has('fg:red')).toBe(false)
    expect(ex.validClasses.has('bg:red')).toBe(false)
  })
})
