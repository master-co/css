import { createServerRenderer } from '@master/css-server'
import type { NitroApp } from 'nitropack'
// @ts-expect-error virtual module
import manifest from 'virtual:master-css-manifest'
// @ts-expect-error virtual module
import emittedGlobals from 'virtual:master-css-emitted-globals'

export default ((nitro: NitroApp) => {
  const renderer = createServerRenderer({ manifest, emittedGlobals })
  nitro.hooks.hook('close', () => renderer.dispose())
  nitro.hooks.hook('render:response', async (response) => {
    if (typeof response.body === 'string' && (response.headers?.['Content-Type'] || response.headers?.['content-type'])?.includes('html')) {
      const rendered = renderer.renderHTML(response.body, { hydrationManifest: 'inject' })
      response.body = rendered.html
    }
  })
})
