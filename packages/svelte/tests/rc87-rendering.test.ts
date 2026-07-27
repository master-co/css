import { describe, expect, test } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import {
  MASTER_CSS_HYDRATION_MANIFEST_ATTR,
  MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
} from '@master/css-schema/hydration-manifest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createMasterCSSHandle } from '../src/lib/server.js'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function countManifestScripts(html: string) {
  return html.match(new RegExp(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`, 'g'))?.length ?? 0
}

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

describe('rc.87 Svelte server hook renderer', () => {
  test('injects collected CSS when the head closes', async () => {
    const html = await renderWithHandle(
      createMasterCSSHandle({ manifest: defaultManifest }),
      [
        '<html><head><meta class="block">',
        '</head><body><div class="fg:red"></div></body></html>'
      ]
    )

    expect(html).toContain('<style id="master-css">')
    expect(html).toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
    expect(html).toContain('"className":"block"')
    expect(html).toContain('"className":"fg:red"')
    expect(countManifestScripts(html)).toBe(1)
    expect(html).toContain('.block')
    expect(html).toContain('.fg\\:red')
    expect(html).toContain('</script></head>')
  })

  test('keeps streaming after early injection and leaves later classes to hydration', async () => {
    const html = await renderWithHandle(
      createMasterCSSHandle({ manifest: defaultManifest }),
      [
        '<html><head><meta class="block"></head>',
        '<body><div class="fg:red"></div></body></html>'
      ]
    )

    expect(html).toContain('.block')
    expect(html).not.toContain('.fg\\:red')
    expect(html).toContain('<body><div class="fg:red"></div>')
  })

  test('supports an external hydration manifest writer', async () => {
    let manifestJSON = ''
    let manifestHash = ''
    const html = await renderWithHandle(createMasterCSSHandle({
      manifest: defaultManifest,
      hydrationManifest: {
        type: 'external',
        write(json, hash) {
          manifestJSON = json
          manifestHash = hash
          return `/_master-css/hydration/master-css-hydration.${hash}.json`
        }
      }
    }), [
      '<html><head></head><body><div class="block"></div></body></html>'
    ])

    expect(manifestHash).toMatch(/^[0-9a-f]{8}$/)
    expect(JSON.parse(manifestJSON).rules.map((rule: { className: string }) => rule.className))
      .toEqual(['block'])
    expect(html).toContain(
      `${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="/_master-css/hydration/master-css-hydration.${manifestHash}.json"`
    )
    expect(html).not.toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
    expect(countManifestScripts(html)).toBe(0)
  })

  test('does not duplicate emitted global variables and keyframes in streamed CSS', async () => {
    const html = await renderWithHandle(createMasterCSSHandle({
      manifest: defaultManifest,
      emittedGlobals: {
        variables: {
          'animate-fade': 1,
          'color-red-60': 1
        },
        animations: {
          fade: 1
        }
      }
    }), [
      '<html><head></head><body><div class="bg:red-60 animate:fade"></div></body></html>'
    ])

    expect(html).toContain('.bg\\:red-60{background-color:var(--color-red-60)}')
    expect(html).toContain('.animate\\:fade{animation:var(--animate-fade)}')
    expect(html).not.toContain('--color-red-60:')
    expect(html).not.toContain('--animate-fade:')
    expect(html).not.toContain('@keyframes fade')
  })

  test('writes static external hydration manifests', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'master-css-svelte-'))
    try {
      const html = await renderWithHandle(createMasterCSSHandle({
        manifest: defaultManifest,
        hydrationManifest: {
          type: 'external',
          write(json, hash) {
            const directory = join(dir, '_master-css', 'hydration')
            const file = join(directory, `master-css-hydration.${hash}.json`)
            mkdirSync(directory, { recursive: true })
            writeFileSync(file, json)
            return `/_master-css/hydration/master-css-hydration.${hash}.json`
          }
        }
      }), [
        '<html><head></head><body><div class="block"></div></body></html>'
      ])
      const source = html.match(
        new RegExp(`${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="([^"]+)"`)
      )?.[1]
      const file = join(dir, source?.replace(/^\//u, '') ?? '')

      expect(source).toMatch(/^\/_master-css\/hydration\/master-css-hydration\.[0-9a-f]{8}\.json$/)
      expect(existsSync(file)).toBe(true)
      expect(readFileSync(file, 'utf8')).toContain('"className":"block"')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('replaces an existing master style in the current chunk', async () => {
    const html = await renderWithHandle(
      createMasterCSSHandle({ manifest: defaultManifest }),
      ['<html><head><style id="master-css"></style></head><body class="block"></body></html>']
    )

    expect(html).toContain('<style id="master-css">@layer utilities{.block{display:block}}</style>')
    expect(html.match(/id="master-css"/g)).toHaveLength(1)
  })

  test('replaces an existing hydration manifest in the current chunk', async () => {
    const html = await renderWithHandle(
      createMasterCSSHandle({ manifest: defaultManifest }),
      [[
        '<html><head><style id="master-css"></style>',
        `<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[]}</script>`,
        '</head><body class="block"></body></html>'
      ].join('')]
    )

    expect(html).not.toContain('"rules":[]')
    expect(html).toContain('"className":"block"')
    expect(countManifestScripts(html)).toBe(1)
  })
})
