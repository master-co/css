import { describe, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { normalizePath } from 'vite'
import LocalStylesPlugin from '../../src/plugins/local-styles'

function createFixture() {
  const root = realpathSync.native(mkdtempSync(path.join(tmpdir(), 'master-css-vite-local-compose-')))
  mkdirSync(path.join(root, 'src'), { recursive: true })
  writeFileSync(path.join(root, 'app.css'), `
    @import url("@master/css");

    @theme {
  --color-brand: #123456;
}

  `)
  return root
}

function createContext(root: string) {
  return {
    config: {
      root,
      server: {
        fs: {
          allow: []
        }
      }
    }
  } as any
}

describe('LocalStylesPlugin', () => {
  test('preserves native declarations in CSS Modules without emitting a Master CSS slot', async () => {
    const root = createFixture()
    try {
      const context = createContext(root)
      const plugin = LocalStylesPlugin({} as any, context)
      const addWatchFile = vi.fn()
      await (plugin as any).buildStart.call({})

      const result = await (plugin as any).transform.call(
        { addWatchFile },
        ".button { @media all {display:inline-flex;background-color:var(--color-brand);color:white;} }",
        path.join(root, 'src/Button.module.css')
      )

      expect(result.code).toMatch(/\.button\s*\{/)
      expect(result.code).toMatch(/display:\s*inline-flex/)
      expect(result.code).toContain('background-color:var(--color-brand)'
      )
      expect(result.code).toContain('--color-brand:#123456')
      expect(result.code).toMatch(/color:\s*(?:#fff|white)/)
      expect(result.code).not.toContain('@compose')
      expect(result.code).not.toContain('master-css-slot')
      expect(addWatchFile).toHaveBeenCalledWith(normalizePath(path.join(root, 'app.css')))
      expect(addWatchFile).toHaveBeenCalledWith(normalizePath(path.join(root, 'src/Button.module.css')))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('retains local resources when discovered entries are not guaranteed loaded', async () => {
    const root = createFixture()
    try {
      writeFileSync(path.join(root, 'app.css'), [
        '@import url("@master/css");',
        '.global-section { padding-block: var(--spacing-5xl); }'
      ].join('\n'))
      const context = createContext(root)
      const plugin = LocalStylesPlugin({} as any, context)
      const addWatchFile = vi.fn()

      const result = await (plugin as any).transform.call(
        { addWatchFile },
        ".home { @media all {padding-block:var(--spacing-5xl);} }",
        path.join(root, 'src/Home.module.css')
      )

      expect(result.code).toMatch(/\.home\s*\{[\s\S]*padding-block:\s*var\(--spacing-5xl\)/)
      expect(result.code).toContain('--spacing-5xl:')
      expect(result.code).not.toContain('master-css-slot')
      expect(addWatchFile).toHaveBeenCalledWith(normalizePath(path.join(root, 'app.css')))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('leaves ordinary CSS and Master entries to their existing pipelines', async () => {
    const root = createFixture()
    try {
      const context = createContext(root)
      const plugin = LocalStylesPlugin({} as any, context)

      expect(await (plugin as any).transform.call(
        {},
        ".button { color: red; }",
        path.join(root, 'src/Button.module.css')
      )).toBeUndefined()
      expect(await (plugin as any).transform.call(
        {},
        "@import url(\"@master/css\"); .button { @media all {display:block;} }",
        path.join(root, 'src/app.css')
      )).toBeUndefined()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('preserves native declarations in SFC style requests', async () => {
    const root = createFixture()
    try {
      const context = createContext(root)
      const plugin = LocalStylesPlugin({} as any, context)

      const result = await (plugin as any).transform.call(
        { addWatchFile: vi.fn() },
        ".button { @media all {display:block;} }",
        path.join(root, 'src/Button.vue') + '?vue&type=style&index=0&lang.css'
      )

      expect(result).toBeUndefined()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('resolves explicit @reference styles and watches the reference file', async () => {
    const root = createFixture()
    try {
      const themePath = path.join(root, 'src/theme.css')
      writeFileSync(themePath, `@theme {
  --spacing-card: 2rem;
}
@keyframes pop {
    to { opacity: 1; }
  }

@mixin --brand {
    padding: var(--spacing-card);
    animation: pop 1s;
  }
.referenced-native { color: red; }`)
      const context = createContext(root)
      const plugin = LocalStylesPlugin({} as any, context)
      const addWatchFile = vi.fn()

      const result = await (plugin as any).transform.call(
        { addWatchFile },
        "@reference \"./theme.css\"; .button { @media all {padding:var(--spacing-card);animation:pop 1s;} }",
        path.join(root, 'src/Button.module.css')
      )

      expect(result.code).toMatch(/padding:\s*var\(--spacing-card\)/)
      expect(result.code).toContain('--spacing-card:2rem')
      expect(result.code).not.toContain('@keyframes pop')
      expect(result.code).not.toContain('@reference')
      expect(result.code).not.toContain('referenced-native')
      expect(result.code).not.toContain('master-css-slot')
      expect(addWatchFile).toHaveBeenCalledWith(normalizePath(themePath))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test.each(['Button.css', 'Button.module.css'])('emits native token references in local %s without a utility class', async (name) => {
    const root = createFixture()
    try {
      writeFileSync(path.join(root, 'app.css'), `@import url("@master/css");
@theme {
  --color-brand: #123456;
}

@media (prefers-color-scheme: light) { :root, :host { --color-brand: #123456; } }

@media (prefers-color-scheme: dark) { :root, :host { --color-brand: #abcdef; } }
`)
      const plugin = LocalStylesPlugin({} as any, createContext(root))
      const result = await (plugin as any).transform.call(
        { addWatchFile: vi.fn() },
        '.button { color: var(--color-brand); }',
        path.join(root, 'src', name)
      )

      expect(result.code).toMatch(/\.button\s*\{\s*color:\s*var\(--color-brand\);?\s*\}/)
      expect(result.code).toContain('--color-brand:#123456')
      expect(result.code).not.toContain('--color-brand:#abcdef')
      expect(result.code).not.toContain('@reference')
      expect(result.code).not.toContain('master-css-slot')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('keeps local style dependencies registered after invalid @compose and recovers on the next run', async () => {
    const root = createFixture()
    try {
      const context = createContext(root)
      const plugin = LocalStylesPlugin({} as any, context)
      const modulePath = path.join(root, 'src/Button.module.css')
      const addWatchFile = vi.fn()

      await expect((plugin as any).transform.call(
        { addWatchFile },
        '.button { @compose bg-missing-token; }',
        modulePath
      )).rejects.toThrow('@compose has been removed')
      expect(addWatchFile).toHaveBeenCalledWith(normalizePath(modulePath))

      const result = await (plugin as any).transform.call(
        { addWatchFile: vi.fn() },
        ".button { @media all{display:block;} }",
        modulePath
      )

      expect(result).toBeUndefined()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('reloads local compose modules without forcing a full reload when project manifest dependencies change', async () => {
    const root = createFixture()
    try {
      const context = createContext(root)
      const plugin = LocalStylesPlugin({} as any, context)
      const modulePath = path.join(root, 'src/Button.module.css')
      const module = { id: modulePath }
      const invalidateModule = vi.fn()
      const reloadModule = vi.fn(async () => undefined)
      const send = vi.fn()

      await (plugin as any).transform.call(
        { addWatchFile: vi.fn() },
        ".button { @media all {background-color:var(--color-brand);} }",
        modulePath
      )
      const result = await (plugin as any).hotUpdate.call({
        environment: {
          moduleGraph: { getModuleById: vi.fn((id) => id === modulePath ? module : undefined), invalidateModule },
          reloadModule, hot: { send }
        }
      }, { file: path.join(root, 'app.css'), modules: [] })

      expect(invalidateModule).toHaveBeenCalledWith(module)
      expect(send).not.toHaveBeenCalled()
      expect(result).toEqual([module])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('reloads the page without requesting a deleted project entry', async () => {
    const root = createFixture()
    try {
      const context = createContext(root)
      const plugin = LocalStylesPlugin({} as any, context)
      const entry = path.join(root, 'app.css')
      const modulePath = path.join(root, 'src/Button.svelte') + '?svelte&type=style&lang.css'
      const localModule = { id: modulePath, file: modulePath }
      const deletedModule = { id: entry, file: entry }
      const send = vi.fn()
      await (plugin as any).transform.call(
        { addWatchFile: vi.fn() },
        ".button { @media all {background-color:var(--color-brand);} }",
        modulePath
      )
      rmSync(entry)
      const result = await (plugin as any).hotUpdate.call({
        environment: {
          name: 'client', hot: { send },
          moduleGraph: { getModuleById: vi.fn((id) => id === modulePath ? localModule : undefined), invalidateModule: vi.fn() }
        }
      }, { type: 'delete', file: entry, modules: [deletedModule] })

      expect(result).toEqual([])
      expect(send).toHaveBeenCalledWith({ type: 'full-reload' })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
