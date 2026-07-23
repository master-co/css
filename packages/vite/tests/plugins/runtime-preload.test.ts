import { describe, expect, it } from 'vitest'
import { DEV_RUNTIME_ENTRY_ID } from '../../src/common'
import RuntimePreloadPlugin from '../../src/plugins/runtime-preload'
import { RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID } from '@master/css-internal/runtime-bootstrap'

describe('RuntimePreloadPlugin', () => {
  it('injects a dev modulepreload link for the runtime entry', () => {
    const plugin = RuntimePreloadPlugin({ config: { base: '/' } } as never)
    const result = (plugin.transformIndexHtml as any).handler.call(
      {},
      '<html><head></head><body></body></html>',
      {
        path: '/index.html',
        server: {}
      }
    )

    expect(result.html).toBe('<html><head></head><body></body></html>')
    expect(result.tags).toEqual([
      {
        tag: 'link',
        attrs: {
          rel: 'modulepreload',
          crossorigin: '',
          href: DEV_RUNTIME_ENTRY_ID
        },
        injectTo: 'head-prepend'
      }
    ])
  })

  it('injects a build modulepreload link for the chunk containing the runtime entry', () => {
    const plugin = RuntimePreloadPlugin({ config: { base: '/' } } as never)
    const result = (plugin.transformIndexHtml as any).handler.call(
      {},
      '<html><head></head><body></body></html>',
      {
        path: '/index.html',
        bundle: {
          'assets/index.C2zmEykZ.js': {
            type: 'chunk',
            fileName: 'assets/index.C2zmEykZ.js',
            moduleIds: [
              '/repo/app/src/main.ts',
              RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID
            ]
          },
          'assets/mastercss_wasm_runtime_bg.D4cafe.wasm': {
            type: 'asset',
            fileName: 'assets/mastercss_wasm_runtime_bg.D4cafe.wasm',
            name: 'mastercss_wasm_runtime_bg.wasm'
          }
        }
      }
    )

    expect(result.tags).toEqual([
      {
        tag: 'link',
        attrs: {
          rel: 'modulepreload',
          crossorigin: '',
          href: '/assets/index.C2zmEykZ.js'
        },
        injectTo: 'head-prepend'
      },
      {
        tag: 'link',
        attrs: {
          rel: 'preload',
          as: 'fetch',
          type: 'application/wasm',
          crossorigin: '',
          href: '/assets/mastercss_wasm_runtime_bg.D4cafe.wasm'
        },
        injectTo: 'head-prepend'
      }
    ])
  })

  it('does not inject a duplicate runtime preload link', () => {
    const plugin = RuntimePreloadPlugin({ config: { base: '/' } } as never)
    const html = [
      '<html><head>',
      '<link rel="modulepreload" href="/assets/index.C2zmEykZ.js">',
      '</head><body></body></html>'
    ].join('')
    const result = (plugin.transformIndexHtml as any).handler.call(
      {},
      html,
      {
        path: '/index.html',
        bundle: {
          'assets/index.C2zmEykZ.js': {
            type: 'chunk',
            fileName: 'assets/index.C2zmEykZ.js',
            moduleIds: [
              RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID
            ]
          }
        }
      }
    )

    expect(result).toBeUndefined()
  })

  it('does not inject a duplicate runtime Wasm preload link', () => {
    const plugin = RuntimePreloadPlugin({ config: { base: '/' } } as never)
    const href = '/assets/mastercss_wasm_runtime_bg.D4cafe.wasm'
    const html = `<html><head><link rel="preload" as="fetch" type="application/wasm" crossorigin href="${href}"></head></html>`
    const result = (plugin.transformIndexHtml as any).handler.call({}, html, {
      path: '/index.html',
      bundle: {
        'assets/mastercss_wasm_runtime_bg.D4cafe.wasm': {
          type: 'asset',
          fileName: 'assets/mastercss_wasm_runtime_bg.D4cafe.wasm',
          name: 'mastercss_wasm_runtime_bg.wasm'
        }
      }
    })

    expect(result).toBeUndefined()
  })

  it('does not inject before the runtime chunk is available', () => {
    const plugin = RuntimePreloadPlugin({ config: { base: '/' } } as never)
    const result = (plugin.transformIndexHtml as any).handler.call(
      {},
      '<html><head></head><body></body></html>',
      {
        path: '/index.html',
        bundle: {}
      }
    )

    expect(result).toBeUndefined()
  })
})
