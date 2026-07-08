import { describe, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import LocalComposePlugin from '../../src/plugins/local-compose'

function createFixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'master-css-vite-local-compose-'))
  mkdirSync(path.join(root, 'src'), { recursive: true })
  writeFileSync(path.join(root, 'app.css'), `
    @master entry;

    @components {
      brand {
        background-color: #123456;
      }
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

describe('LocalComposePlugin', () => {
  test('lowers @compose in CSS Modules without emitting a Master CSS slot', async () => {
    const root = createFixture()
    try {
      const context = createContext(root)
      const plugin = LocalComposePlugin({} as any, context)
      const addWatchFile = vi.fn()
      await (plugin as any).buildStart.call({})

      const result = await (plugin as any).transform.call(
        { addWatchFile },
        '.button { @compose inline-flex brand; color: white; }',
        path.join(root, 'src/Button.module.css')
      )

      expect(result.code).toContain('.button{')
      expect(result.code).toContain('display:inline-flex')
      expect(result.code).toContain('background-color:#123456')
      expect(result.code).toContain('color:#fff')
      expect(result.code).not.toContain('@compose')
      expect(result.code).not.toContain('master-css-slot')
      expect(addWatchFile).toHaveBeenCalledWith(path.join(root, 'app.css'))
      expect(addWatchFile).toHaveBeenCalledWith(path.join(root, 'src/Button.module.css'))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('dedupes theme variables already emitted by global style entries', async () => {
    const root = createFixture()
    try {
      writeFileSync(path.join(root, 'app.css'), [
        '@import "@master/css";',
        '.global-section { padding-block: var(--spacing-5xl); }'
      ].join('\n'))
      const context = createContext(root)
      const plugin = LocalComposePlugin({} as any, context)
      const addWatchFile = vi.fn()

      const result = await (plugin as any).transform.call(
        { addWatchFile },
        '.home { @compose py:5xl; }',
        path.join(root, 'src/Home.module.css')
      )

      expect(result.code).toContain('.home{padding-block:var(--spacing-5xl)}')
      expect(result.code).not.toContain('--spacing-5xl:')
      expect(result.code).not.toContain('master-css-slot')
      expect(addWatchFile).toHaveBeenCalledWith(path.join(root, 'app.css'))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('leaves ordinary CSS and Master entries to their existing pipelines', async () => {
    const root = createFixture()
    try {
      const context = createContext(root)
      const plugin = LocalComposePlugin({} as any, context)

      expect(await (plugin as any).transform.call(
        {},
        '.button { color: red; }',
        path.join(root, 'src/Button.module.css')
      )).toBeUndefined()
      expect(await (plugin as any).transform.call(
        {},
        '@master entry; .button { @compose block; }',
        path.join(root, 'src/app.css')
      )).toBeUndefined()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('lowers @compose in SFC style requests', async () => {
    const root = createFixture()
    try {
      const context = createContext(root)
      const plugin = LocalComposePlugin({} as any, context)

      const result = await (plugin as any).transform.call(
        { addWatchFile: vi.fn() },
        '.button { @compose block; }',
        path.join(root, 'src/Button.vue') + '?vue&type=style&index=0&lang.css'
      )

      expect(result.code).toBe('.button{display:block}')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('lowers explicit @reference styles and watches the reference file', async () => {
    const root = createFixture()
    try {
      const themePath = path.join(root, 'src/theme.css')
      writeFileSync(themePath, [
        '@theme {',
        '  --spacing-card: 2rem;',
        '',
        '  @keyframes pop {',
        '    to { opacity: 1; }',
        '  }',
        '}',
        '@components {',
        '  brand {',
        '    padding: var(--spacing-card);',
        '    animation: pop 1s;',
        '  }',
        '}',
        '.referenced-native { color: red; }'
      ].join('\n'))
      const context = createContext(root)
      const plugin = LocalComposePlugin({} as any, context)
      const addWatchFile = vi.fn()

      const result = await (plugin as any).transform.call(
        { addWatchFile },
        '@reference "./theme.css"; .button { @compose brand; }',
        path.join(root, 'src/Button.module.css')
      )

      expect(result.code).toContain('.button{padding:var(--spacing-card);animation:1s pop}')
      expect(result.code).toContain('--spacing-card:2rem')
      expect(result.code).toContain('@keyframes pop')
      expect(result.code).not.toContain('@reference')
      expect(result.code).not.toContain('referenced-native')
      expect(result.code).not.toContain('master-css-slot')
      expect(addWatchFile).toHaveBeenCalledWith(themePath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('keeps local style dependencies registered after invalid @compose and recovers on the next run', async () => {
    const root = createFixture()
    try {
      const context = createContext(root)
      const plugin = LocalComposePlugin({} as any, context)
      const modulePath = path.join(root, 'src/Button.module.css')
      const addWatchFile = vi.fn()

      await expect((plugin as any).transform.call(
        { addWatchFile },
        '.button { @compose bg:neutral-120; }',
        modulePath
      )).rejects.toThrow('Invalid @compose class')
      expect(addWatchFile).toHaveBeenCalledWith(modulePath)

      const result = await (plugin as any).transform.call(
        { addWatchFile: vi.fn() },
        '.button { @compose block; }',
        modulePath
      )

      expect(result.code).toContain('.button{display:block}')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('reloads local compose modules without forcing a full reload when project manifest dependencies change', async () => {
    const root = createFixture()
    try {
      const context = createContext(root)
      const plugin = LocalComposePlugin({} as any, context)
      const modulePath = path.join(root, 'src/Button.module.css')
      const module = { id: modulePath }
      const invalidateModule = vi.fn()
      const reloadModule = vi.fn(async () => undefined)
      const send = vi.fn()

      await (plugin as any).transform.call(
        { addWatchFile: vi.fn() },
        '.button { @compose brand; }',
        modulePath
      )
      const result = await (plugin as any).handleHotUpdate({
        file: path.join(root, 'app.css'),
        server: {
          moduleGraph: {
            getModuleById: vi.fn((id) => id === modulePath ? module : undefined),
            invalidateModule
          },
          reloadModule,
          ws: { send }
        }
      })

      expect(invalidateModule).toHaveBeenCalledWith(module)
      expect(reloadModule).toHaveBeenCalledWith(module)
      expect(send).not.toHaveBeenCalled()
      expect(result).toEqual([])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
