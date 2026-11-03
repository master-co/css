import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { toHashedManifestAssetFileName } from '@master/css-internal/node'
import { externalizeHydrationManifest } from '@master/css-server'
import {
  MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE,
  MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME
} from '@master/css-schema/hydration-manifest'

interface NitroPrerenderRoute {
  contents?: string
  contentType?: string
  fileName?: string
}

interface NitroPrerenderContext {
  options: {
    baseURL?: string
    output: {
      publicDir: string
    }
  }
}

interface NitroPrerenderHookContext extends NitroPrerenderContext {
  hooks: {
    hook(
      name: 'prerender:generate',
      handler: (route: NitroPrerenderRoute) => void
    ): void
  }
}

function isHTMLPrerenderRoute(route: NitroPrerenderRoute) {
  return route.contentType?.includes('html') || route.fileName?.endsWith('.html')
}

function toPublicAssetBase(baseURL = '/') {
  return `${baseURL.replace(/\/?$/, '/')}_master-css/hydration/`
}

function toHydrationManifestAssetURL(
  fileName: string,
  base = MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE
) {
  return `${base.replace(/\/?$/, '/')}${fileName}`
}

export function externalizeNitroPrerenderHydrationManifest(
  route: NitroPrerenderRoute,
  nitro: NitroPrerenderContext
) {
  if (!route.contents || !isHTMLPrerenderRoute(route)) return
  let fileName = ''
  const externalized = externalizeHydrationManifest(route.contents, (json) => {
    fileName = toHashedManifestAssetFileName(json, MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME)
    return toHydrationManifestAssetURL(fileName, toPublicAssetBase(nitro.options.baseURL))
  })
  if (!externalized) return
  const filePath = resolve(
    nitro.options.output.publicDir,
    '_master-css',
    'hydration',
    fileName
  )
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, externalized.json)
  route.contents = externalized.html
}

export function registerNitroPrerenderHydrationManifest(
  nitro: NitroPrerenderHookContext
) {
  nitro.hooks.hook('prerender:generate', (route) => {
    externalizeNitroPrerenderHydrationManifest(route, nitro)
  })
}
