import { describe, expect, it } from 'vitest'
import { DEV_RUNTIME_ENTRY_ID } from '../../src/common'
import RuntimePreloadPlugin from '../../src/plugins/runtime-preload'

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
              '/repo/packages/vite/src/runtime.ts'
            ]
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
              '/repo/packages/vite/src/runtime.ts'
            ]
          }
        }
      }
    )

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
