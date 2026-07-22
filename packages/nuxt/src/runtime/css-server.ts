import { createServerRenderer } from '@master/css-server'
import type { NitroApp } from 'nitropack'
// @ts-expect-error virtual module
import manifest from 'virtual:master-css-manifest'

export default ((nitro: NitroApp) => {
  const renderer = createServerRenderer(manifest)
  nitro.hooks.hook('close', () => renderer.dispose())
  nitro.hooks.hook('render:response', async (response) => {
    if (typeof response.body === 'string' && (response.headers?.['Content-Type'] || response.headers?.['content-type'])?.includes('html')) {
      const rendered = renderer.render(response.body, { hydrationManifest: 'inject' })
      try {
        response.body = rendered.html
      } finally {
        rendered.css?.dispose()
      }
    }
  })
})
