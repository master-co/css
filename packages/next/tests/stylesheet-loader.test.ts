import { readStylesheetText } from './helpers/stylesheet-output'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import masterCSSStylesheetLoader from '../src/stylesheet-loader'

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'master-css-next-style-'))
  mkdirSync(join(root, 'app'), { recursive: true })
  return root
}

function runStylesheetLoader(root: string, resourcePath: string, source: string) {
  const dependencies: string[] = []
  return new Promise<string>((resolve, reject) => {
    const context: ThisParameterType<typeof masterCSSStylesheetLoader> = {
      resourcePath,
      rootContext: root,
      addDependency: (dependency) => dependencies.push(dependency),
      async: () => (error, content) => {
        if (error) {
          const loaderError = error as Error & { dependencies?: string[] }
          loaderError.dependencies = dependencies
          reject(loaderError)
        } else {
          resolve(content || '')
        }
      }
    }

    masterCSSStylesheetLoader.call(context, source)
  }).then((content) => ({ content: readStylesheetText(resourcePath, content), dependencies }))
}

describe('Next style CSS loader', () => {
  it('derives native CSS from @master/css instead of hardcoding a package subpath', async () => {
    const root = createFixture()
    const entryPath = join(root, 'app/globals.css')
    const result = await runStylesheetLoader(root, entryPath, '@import "@master/css";')

    expect(result.content).toContain('@layer base')
    expect(result.content).toContain('text-rendering: geometricprecision')
    expect(result.content).not.toContain('@master/css/base.css')
    expect(result.content).not.toContain('@import "@master/css"')
    expect(result.content).not.toContain('virtual:master-utilities.css')
    expect(result.dependencies).toContain(entryPath)
    expect(result.dependencies.length).toBeGreaterThan(0)
  })

  it('keeps @master entry lightweight without importing package CSS', async () => {
    const root = createFixture()
    const entryPath = join(root, 'app/globals.css')
    const result = await runStylesheetLoader(root, entryPath, '@master entry;')

    expect(result.content).not.toContain('@layer base')
    expect(result.content).not.toContain('@master entry;')
    expect(result.dependencies).toContain(entryPath)
  })

  it('preserves native CSS and keyframes from imported Master entry graphs', async () => {
    const root = createFixture()
    const entryPath = join(root, 'app/globals.css')
    const homePath = join(root, 'app/home.css')
    writeFileSync(homePath, [
      '@theme { --color-active: #ff0000; }',
      '@utilities { active-card { animation: active-spin 1s infinite; } }',
      '@keyframes active-spin { to { opacity: .5; } }',
      '.native-card { color: var(--color-active); }'
    ].join('\n'))

    const result = await runStylesheetLoader(root, entryPath, [
      '@import "@master/css";',
      '@import "./home.css";'
    ].join('\n'))

    expect(result.content).toContain('@keyframes active-spin')
    expect(result.content).toContain('.native-card')
    expect(result.content).toContain('--color-active:red')
    expect(result.content).not.toContain('@utilities')
    expect(result.content).not.toContain('@import "./home.css"')
    expect(result.dependencies).toContain(entryPath)
    expect(result.dependencies).toContain(homePath)
  })

  it('leaves ordinary CSS unchanged', async () => {
    const root = createFixture()
    const source = '.card { color: red; }'
    const result = await runStylesheetLoader(root, join(root, 'app/card.css'), source)

    expect(result.content).toBe(source)
    expect(result.dependencies).toEqual([])
  })

  it('locally lowers @compose in CSS Modules without importing package CSS', async () => {
    const root = createFixture()
    writeFileSync(join(root, 'app/globals.css'), `
      @master entry;

      @utilities {
        brand {
          background-color: #123456;
        }
      }
    `)
    const result = await runStylesheetLoader(
      root,
      join(root, 'app/Button.module.css'),
      '.button { @compose inline-flex brand; color: white; }'
    )

    expect(result.content).toContain('.button{')
    expect(result.content).toContain('display:inline-flex')
    expect(result.content).toContain('background-color:#123456')
    expect(result.content).toContain('color:#fff')
    expect(result.content).not.toContain('@compose')
    expect(result.content).not.toContain('@master/css')
    expect(result.dependencies).toContain(join(root, 'app/globals.css'))
    expect(result.dependencies).toContain(join(root, 'app/Button.module.css'))
  })

  it('locally lowers explicit @reference CSS Modules without importing package CSS', async () => {
    const root = createFixture()
    const tokenPath = join(root, 'app/tokens.css')
    const modulePath = join(root, 'app/Button.module.css')
    writeFileSync(tokenPath, '@utilities { brand { color: #123456; } }')
    const result = await runStylesheetLoader(
      root,
      modulePath,
      '@reference "./tokens.css"; .button { @compose brand; }'
    )

    expect(result.content).toContain('.button{color:#123456}')
    expect(result.content).not.toContain('@reference')
    expect(result.content).not.toContain('@master/css')
    expect(result.dependencies).toContain(modulePath)
    expect(result.dependencies).toContain(tokenPath)
  })

  it('lowers referenced mode directives in a locally imported stylesheet', async () => {
    const root = createFixture()
    const globalsPath = join(root, 'app/globals.css')
    const localPath = join(root, 'app/local.css')
    writeFileSync(globalsPath, '@import "@master/css";')

    const result = await runStylesheetLoader(root, localPath, [
      '@reference "./globals.css";',
      '@layer components { .card { @dark { color: red; } } }'
    ].join('\n'))

    expect(result.content).toContain('.card')
    expect(result.content).toContain('color:red')
    expect(result.content).not.toContain('@reference')
    expect(result.content).not.toContain('@dark')
    expect(result.dependencies).toContain(globalsPath)
  })

  it('emits a theme variable used by native CSS in a referenced local stylesheet', async () => {
    const root = createFixture()
    const globalsPath = join(root, 'app/globals.css')
    writeFileSync(globalsPath, '@master entry; @theme { --color-brand: #123456; }')

    const result = await runStylesheetLoader(
      root,
      join(root, 'app/button.css'),
      '@reference "./globals.css"; .button { color: var(--color-brand); }'
    )

    expect(result.content).toMatch(/color:\s*var\(--color-brand\)/)
    expect(result.content).toContain('--color-brand:')
    expect(result.content).not.toContain('@reference')
  })

  it('emits referenced default theme variables for page-level CSS', async () => {
    const root = createFixture()
    const globalsPath = join(root, 'app/globals.css')
    const pagePath = join(root, 'app/page.css')
    writeFileSync(globalsPath, '@import "@master/css";')

    const result = await runStylesheetLoader(
      root,
      pagePath,
      '@reference "./globals.css"; .home-section { @compose py-5xl; }'
    )

    expect(result.content).toContain('.home-section{padding-block:var(--spacing-5xl)}')
    expect(result.content).toContain('--spacing-5xl:')
    expect(result.content).not.toContain('@reference')
    expect(result.content).not.toContain('@master/css')
    expect(result.dependencies).toContain(pagePath)
    expect(result.dependencies).toContain(globalsPath)
  })

  it('dedupes referenced default theme variables already emitted by global CSS for page-level CSS', async () => {
    const root = createFixture()
    const globalsPath = join(root, 'app/globals.css')
    const pagePath = join(root, 'app/page.css')
    writeFileSync(globalsPath, [
      '@import "@master/css";',
      '.global-section { padding-block: var(--spacing-5xl); }'
    ].join('\n'))

    const result = await runStylesheetLoader(
      root,
      pagePath,
      '@reference "./globals.css"; .home-section { @compose py-5xl; }'
    )

    expect(result.content).toContain('.home-section{padding-block:var(--spacing-5xl)}')
    expect(result.content).not.toContain('--spacing-5xl:')
    expect(result.content).not.toContain('@reference')
    expect(result.content).not.toContain('@master/css')
    expect(result.dependencies).toContain(pagePath)
    expect(result.dependencies).toContain(globalsPath)
  })

  it('keeps local style dependencies registered after invalid @compose and recovers on the next run', async () => {
    const root = createFixture()
    const modulePath = join(root, 'app/Button.module.css')
    let error: Error & { dependencies?: string[] } | undefined

    try {
      await runStylesheetLoader(root, modulePath, '.button { @compose bg-missing-token; }')
    } catch (caught) {
      error = caught as Error & { dependencies?: string[] }
    }
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toContain('Invalid @compose utility')
    expect(error?.dependencies).toContain(modulePath)

    const result = await runStylesheetLoader(root, modulePath, '.button { @compose block; }')

    expect(result.content).toContain('.button{display:block}')
    expect(result.dependencies).toContain(modulePath)
  })
})
