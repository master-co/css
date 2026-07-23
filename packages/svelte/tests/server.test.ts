import { describe, expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import {
  MASTER_CSS_HYDRATION_MANIFEST_ATTR,
  MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
} from '@master/css-schema/hydration-manifest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createMasterCSSHandle } from '../src/lib/server.js'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

async function renderWithHandle(
  handle: ReturnType<typeof createMasterCSSHandle>,
  chunks: readonly string[]
) {
  const response = await handle({
    event: {} as never,
    resolve: async (_event, options) => {
      const transformed: string[] = []
      for (let index = 0; index < chunks.length; index++) {
        transformed.push(
          await options?.transformPageChunk?.({
            html: chunks[index],
            done: index === chunks.length - 1
          }) ?? chunks[index]
        )
      }
      return new Response(transformed.join(''))
    }
  })
  return response.text()
}

describe('Svelte server hook renderer', () => {
  test('renders a complete response across arbitrary chunks', async () => {
    const handle = createMasterCSSHandle({ manifest: defaultManifest })
    const html = await renderWithHandle(handle, [
      '<html><he',
      'ad><meta class="block"></head><body>',
      '<div class="fg:red"></div></body></html>'
    ])

    expect(html).toContain('<style id="master-css">')
    expect(html).toContain('.block')
    expect(html).toContain('.fg\\:red')
    expect(html).toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
    expect(html.match(new RegExp(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`, 'g')))
      .toHaveLength(1)
  })

  test('isolates render state between responses', async () => {
    const handle = createMasterCSSHandle({ manifest: defaultManifest })
    const first = await renderWithHandle(handle, [
      '<html><head></head><body class="fg:red"></body></html>'
    ])
    const second = await renderWithHandle(handle, [
      '<html><head></head><body class="fg:blue"></body></html>'
    ])

    expect(first).toContain('.fg\\:red')
    expect(first).not.toContain('.fg\\:blue')
    expect(second).toContain('.fg\\:blue')
    expect(second).not.toContain('.fg\\:red')
  })

  test('supports external hydration manifest storage', async () => {
    let manifestJSON = ''
    let manifestHash = ''
    const handle = createMasterCSSHandle({
      manifest: defaultManifest,
      hydrationManifest: {
        type: 'external',
        write(json, hash) {
          manifestJSON = json
          manifestHash = hash
          return `/hydration/${hash}.json`
        }
      }
    })
    const html = await renderWithHandle(handle, [
      '<html><head></head><body class="block"></body></html>'
    ])

    expect(manifestHash).toMatch(/^[0-9a-f]{8}$/)
    expect(JSON.parse(manifestJSON).rules).toEqual([
      expect.objectContaining({ className: 'block' })
    ])
    expect(html).toContain(
      `${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="/hydration/${manifestHash}.json"`
    )
    expect(html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
  })

  test('honors emitted globals and disabled hydration', async () => {
    const handle = createMasterCSSHandle({
      manifest: defaultManifest,
      hydrationManifest: false,
      emittedGlobals: {
        variables: {
          'animate-fade': 1,
          'color-red-60': 1
        },
        animations: {
          fade: 1
        }
      }
    })
    const html = await renderWithHandle(handle, [
      '<html><head></head><body class="bg:red-60 animate:fade"></body></html>'
    ])

    expect(html).toContain('.bg\\:red-60{background-color:var(--color-red-60)}')
    expect(html).toContain('.animate\\:fade{animation:var(--animate-fade)}')
    expect(html).not.toContain('--color-red-60:')
    expect(html).not.toContain('@keyframes fade')
    expect(html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
  })
})
