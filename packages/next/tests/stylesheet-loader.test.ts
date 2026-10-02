import { readStylesheetText } from './helpers/stylesheet-output'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
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
  }).then((content) => ({ content: readStylesheetText(resourcePath, content), code: content, dependencies }))
}

describe('Next style CSS loader', () => {
  it('passes published static sidecars through without rebuilding the project manifest', async () => {
    const root = createFixture()
    // An immutable output must remain loadable even while the author is editing
    // an invalid entry. The source entry loader owns that error and its watches.
    writeFileSync(join(root, 'app/globals.css'), '@import "@master/css"; @utility broken:<number> { width:var(--value); }')
    const file = join(root, '.master', `next-style-${'a'.repeat(64)}-${'b'.repeat(64)}.css`)
    const source = "@layer utilities{.padding\\:11px{padding:11px}}"
    const result = await runStylesheetLoader(root, file, source)
    expect(result.code).toBe(source)
    expect(result.dependencies).toEqual([])
    await expect(runStylesheetLoader(root, join(root, 'app/authored.css'), '.card{color:red}')).rejects.toThrow()
  })

  it('relocates global token URLs through the resource delivery graph', async () => {
    const root = createFixture()
    const image = join(root, 'app/pattern.svg')
    const tokens = join(root, 'app/tokens.css')
    writeFileSync(image, '<svg xmlns="http://www.w3.org/2000/svg"/>')
    writeFileSync(tokens, `@theme {
  --image-probe: url("./pattern.svg");
}
`)
    const file = join(root, 'app/Pattern.module.css')
    const result = await runStylesheetLoader(root, file, '@reference "./tokens.css"; .card { background-image: var(--image-probe); }')
    const entry = fileURLToPath(new URL(result.code.match(/@import "([^"]+)"/)![1], pathToFileURL(file)))
    const globalCSS = readFileSync(entry, 'utf8')
    const href = globalCSS.match(/url\(["']?([^"')]+)["']?\)/)![1]
    expect(existsSync(fileURLToPath(new URL(href, pathToFileURL(entry))))).toBe(true)
    expect(result.dependencies).toContain(image)
    expect(result.dependencies).toContain(tokens)
    expect(result.code).toContain('var(--image-probe)')
    expect(globalCSS).toContain('sourceMappingURL=')
  })
  it('shares global resources across Modules and republishes referenced changes', async () => {
    const root = createFixture()
    const tokens = join(root, 'app/tokens.css')
    const source = '@reference "./tokens.css"; .card { color: var(--color-shared); }'
    writeFileSync(tokens, `@theme {
  --color-shared: red;
}
`)
    const a = join(root, 'app/A.module.css')
    const b = join(root, 'app/B.module.css')
    const first = await runStylesheetLoader(root, a, source)
    const second = await runStylesheetLoader(root, b, source)
    const asset = (file: string, code: string) => fileURLToPath(new URL(code.match(/@import "([^"]+)"/)![1], pathToFileURL(file)))
    expect(asset(a, first.code)).toBe(asset(b, second.code))
    expect(second.dependencies).toContain(tokens)
    expect(second.dependencies).toContain(asset(b, second.code))
    writeFileSync(tokens, `@theme {
  --color-shared: blue;
}
`)
    const changed = await runStylesheetLoader(root, a, source)
    expect(asset(a, changed.code)).not.toBe(asset(a, first.code))
    expect(changed.content).toContain('--color-shared:blue')
    expect(changed.code).not.toContain('--color-shared:')
  })
  it('derives native CSS from @master/css instead of hardcoding a package subpath', async () => {
    const root = createFixture()
    const entryPath = join(root, 'app/globals.css')
    const result = await runStylesheetLoader(root, entryPath, '@import url("@master/css");')

    expect(result.content).toContain('@layer base')
    expect(result.content).toContain('text-rendering: geometricprecision')
    expect(result.content).not.toContain('@master/css/base.css')
    expect(result.content).not.toContain('@import "@master/css"')
    expect(result.content).not.toContain('virtual:master-utilities.css')
    expect(result.dependencies).toContain(entryPath)
    expect(result.dependencies.length).toBeGreaterThan(0)
  })

  it('loads the full native preset from the project import', async () => {
    const root = createFixture()
    const entryPath = join(root, 'app/globals.css')
    const result = await runStylesheetLoader(root, entryPath, "@import url(\"@master/css\");")

    expect(result.content).toContain('@layer base')
    expect(result.content).not.toContain("@import url(\"@master/css\");")
    expect(result.dependencies).toContain(entryPath)
  })

  it('preserves native CSS and keyframes from imported Master entry graphs', async () => {
    const root = createFixture()
    const entryPath = join(root, 'app/globals.css')
    const homePath = join(root, 'app/home.css')
    writeFileSync(homePath, `@theme {
  --color-active: #ff0000;
}

 @mixin --active-card { animation: active-spin 1s infinite; } @utility active-card { animation: active-spin 1s infinite; }
@keyframes active-spin { to { opacity: .5; } }
.native-card { color: var(--color-active); }`)

    const result = await runStylesheetLoader(root, entryPath, [
      '@import url("@master/css");',
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

  it('locally preserves native declarations in CSS Modules without importing package CSS', async () => {
    const root = createFixture()
    writeFileSync(join(root, 'app/globals.css'), "\n      @import url(\"@master/css\");\n\n      \n        @mixin --brand {\n          background-color: #123456;\n        } @utility brand {\n          background-color: #123456;\n        }\n      \n    ")
    const result = await runStylesheetLoader(
      root,
      join(root, 'app/Button.module.css'),
      ".button { @media all {background-color:#123456;display:inline-flex; color: white;} }"
    )

    expect(result.content).toMatch(/\.button\s*\{/)
    expect(result.content).toMatch(/display:\s*inline-flex/)
    expect(result.content).toMatch(/background-color:\s*#123456/)
    expect(result.content).toMatch(/color:\s*(?:#fff|white)/)
    expect(result.content).not.toContain('@compose')
    expect(result.content).not.toContain('@master/css')
    expect(result.dependencies).toContain(join(root, 'app/globals.css'))
    expect(result.dependencies).toContain(join(root, 'app/Button.module.css'))
  })

  it('locally resolves explicit @reference CSS Modules without importing package CSS', async () => {
    const root = createFixture()
    const tokenPath = join(root, 'app/tokens.css')
    const modulePath = join(root, 'app/Button.module.css')
    writeFileSync(tokenPath, ' @mixin --brand { color: #123456; } @utility brand { color: #123456; } ')
    const result = await runStylesheetLoader(
      root,
      modulePath,
      "@reference \"./tokens.css\"; .button { @media all {color:#123456;} }"
    )

    expect(result.content).toMatch(/\.button\s*\{[\s\S]*color:\s*#123456/)
    expect(result.content).not.toContain('@reference')
    expect(result.content).not.toContain('@master/css')
    expect(result.dependencies).toContain(modulePath)
    expect(result.dependencies).toContain(tokenPath)
  })

  it('lowers referenced mode directives in a locally imported stylesheet', async () => {
    const root = createFixture()
    const globalsPath = join(root, 'app/globals.css')
    const localPath = join(root, 'app/local.css')
    writeFileSync(globalsPath, '@import url("@master/css");')

    const result = await runStylesheetLoader(root, localPath, "@reference \"./globals.css\";\n@layer components { .card { @media (prefers-color-scheme: dark) { color: red; } } }")

    expect(result.content).toContain('.card')
    expect(result.content).toMatch(/color:\s*red/)
    expect(result.content).not.toContain('@reference')
    expect(result.content).not.toContain('@dark')
    expect(result.dependencies).toContain(globalsPath)
  })

  it.each(['button.css', 'button.module.css'])('emits mode variables used by native CSS in referenced %s', async (name) => {
    const root = createFixture()
    const globalsPath = join(root, 'app/globals.css')
    writeFileSync(globalsPath, `@import url("@master/css");
@theme {
  --color-brand: #123456;
}

@media (prefers-color-scheme: light) { :root, :host { --color-brand: #123456; } }

@media (prefers-color-scheme: dark) { :root, :host { --color-brand: #abcdef; } }
`)

    const result = await runStylesheetLoader(
      root,
      join(root, 'app', name),
      '.button { color: var(--color-brand); }'
    )

    expect(result.content).toMatch(/color:\s*var\(--color-brand\)/)
    expect(result.content).toContain('--color-brand:#123456')
    expect(result.content).not.toContain('--color-brand:#abcdef')
    expect(result.content).not.toContain('@reference')
    if (name.endsWith('.module.css')) {
      expect(result.code).toMatch(/^@import /)
      expect(result.content).toMatch(/:root,:host\s*\{--color-brand/)
      expect(result.code).not.toContain('--color-brand:#')
      expect(result.content).not.toMatch(/\.button\s*\{--color-brand:/)
    }
  })

  it('emits referenced default theme variables for page-level CSS', async () => {
    const root = createFixture()
    const globalsPath = join(root, 'app/globals.css')
    const pagePath = join(root, 'app/page.css')
    writeFileSync(globalsPath, '@import url("@master/css");')

    const result = await runStylesheetLoader(
      root,
      pagePath,
      "@reference \"./globals.css\"; .home-section { @media all {padding-block:var(--spacing-5xl);} }"
    )

    expect(result.content).toMatch(/\.home-section\s*\{[\s\S]*padding-block:\s*var\(--spacing-5xl\)/)
    expect(result.content).toContain('--spacing-5xl:')
    expect(result.content).not.toContain('@reference')
    expect(result.content).not.toContain('@master/css')
    expect(result.dependencies).toContain(pagePath)
    expect(result.dependencies).toContain(globalsPath)
  })

  it('retains local resources when a discovered global entry is not guaranteed loaded', async () => {
    const root = createFixture()
    const globalsPath = join(root, 'app/globals.css')
    const pagePath = join(root, 'app/page.css')
    writeFileSync(globalsPath, [
      '@import url("@master/css");',
      '.global-section { padding-block: var(--spacing-5xl); }'
    ].join('\n'))

    const result = await runStylesheetLoader(
      root,
      pagePath,
      "@reference \"./globals.css\"; .home-section { @media all {padding-block:var(--spacing-5xl);} }"
    )

    expect(result.content).toMatch(/\.home-section\s*\{[\s\S]*padding-block:\s*var\(--spacing-5xl\)/)
    expect(result.content).toContain('--spacing-5xl:')
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
    expect(error?.message).toContain('@compose has been removed')
    expect(error?.dependencies).toContain(modulePath)

    const result = await runStylesheetLoader(root, modulePath, ".button { @media all{display:block;} }")

    expect(result.content).toMatch(/\.button\s*\{[\s\S]*display:\s*block/)
    expect(result.dependencies).toEqual([])
  })
})
