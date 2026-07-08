import { describe, expect, it } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { compileBrowserStyleCSS } from '../src/browser'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

describe('@master/css-stylesheet/browser', () => {
  it('renders class names with the compiled manifest', async () => {
    const result = await compileBrowserStyleCSS(`
      @components {
        btn {
          @compose flex;
          color: red;
        }
      }
    `, {
      baseManifest: defaultManifest,
      classNames: ['btn']
    })

    expect(result.css).toContain('.btn')
    expect(result.css).toContain('display:flex')
    expect(result.css).toContain('color:red')
    expect(result.generatedCSS).toContain('.btn')
    expect(result.nativeCSS).toBe('')
  })

  it('preserves native CSS while rendering class names', async () => {
    const result = await compileBrowserStyleCSS(`
      @theme {
        --color-card: #ffffff;
      }

      .native {
        color: var(--color-card);
      }
    `, {
      baseManifest: defaultManifest,
      classNames: ['block']
    })

    expect(result.css).toMatch(/\.native\s*\{\s*color:\s*var\(--color-card\);\s*\}/)
    expect(result.css).toContain('.block{display:block}')
    expect(result.css).toContain('--color-card:#fff')
  })

  it('emits variables referenced by native CSS without class names', async () => {
    const result = await compileBrowserStyleCSS(`
      @theme {
        --color-card: #ffffff;
      }

      .native {
        color: var(--color-card);
      }
    `, {
      baseManifest: defaultManifest
    })

    expect(result.css).toMatch(/\.native\s*\{\s*color:\s*var\(--color-card\);\s*\}/)
    expect(result.css).toContain('--color-card:#fff')
    expect(result.emittedGlobals.variables).toEqual({
      'color-card': 1
    })
  })

  it('emits generated keyframes referenced by native CSS', async () => {
    const result = await compileBrowserStyleCSS('.native { animation: fade 1s; }', {
      baseManifest: defaultManifest
    })

    expect(result.css).toMatch(/\.native\s*\{\s*animation:\s*(?:fade 1s|1s fade);\s*\}/)
    expect(result.css).toContain('@keyframes fade')
    expect(result.emittedGlobals.animations).toEqual({
      fade: 1
    })
  })

  it('does not duplicate generated keyframes defined by native CSS', async () => {
    const result = await compileBrowserStyleCSS([
      '@keyframes fade { to { opacity: .5; } }',
      '.native { animation-name: fade; animation-duration: 1s; }'
    ].join('\n'), {
      baseManifest: defaultManifest
    })

    expect(result.css.match(/@keyframes fade/g) || []).toHaveLength(1)
    expect(result.css).toContain('@keyframes fade')
    expect(result.css).toMatch(/\.native\s*\{\s*animation-name:\s*fade;\s*animation-duration:\s*1s;\s*\}/)
  })

  it('propagates directive warnings', async () => {
    const result = await compileBrowserStyleCSS(`
      @settings {
        mode-trigger: media;
      }

      @theme custom {
        --color-warning-test: #ff0033;
      }
    `, {
      baseManifest: defaultManifest
    })

    expect(result.warnings).toEqual([
      'Custom mode "custom" will not work with mode-trigger: media. Browsers only support light and dark prefers-color-scheme values; use mode-trigger: class or host for custom modes.'
    ])
  })
})
