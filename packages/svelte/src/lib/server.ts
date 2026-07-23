import { toHashedManifestAssetFileName } from '@master/css-build-internal/node'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import {
  MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME
} from '@master/css-schema/hydration-manifest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  createServerRenderer,
  type MasterCSSHydrationManifestRenderMode
} from '@master/css-server'
import type { Handle } from '@sveltejs/kit'

export type MasterCSSSvelteHydrationManifestOption =
  | 'inline'
  | false
  | {
    readonly type: 'external'
    readonly write: (json: string, hash: string) => string
  }

export interface MasterCSSSvelteHandleOptions {
  readonly manifest: MasterCSSManifest
  readonly hydrationManifest?: MasterCSSSvelteHydrationManifestOption
  readonly emittedGlobals?: MasterCSSEmittedGlobals
}

function getHydrationManifestHash(fileName: string) {
  return fileName.slice(
    MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME.length + 1,
    -'.json'.length
  )
}

function resolveHydrationManifestOption(
  option: MasterCSSSvelteHydrationManifestOption = 'inline'
): MasterCSSHydrationManifestRenderMode {
  if (option === false) return false
  if (option === 'inline') return 'inject'
  return {
    type: 'external',
    source(json) {
      const fileName = toHashedManifestAssetFileName(
        json,
        MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME
      )
      return option.write(json, getHydrationManifestHash(fileName))
    }
  }
}

export function createMasterCSSHandle(
  options: MasterCSSSvelteHandleOptions
): Handle {
  const hydrationManifest = resolveHydrationManifestOption(options.hydrationManifest)
  return async ({ event, resolve }) => {
    using renderer = createServerRenderer({
      manifest: options.manifest,
      emittedGlobals: options.emittedGlobals
    })
    using session = renderer.createHTMLRenderSession({ hydrationManifest })
    return await resolve(event, {
      transformPageChunk({ html, done }) {
        return done ? session.end(html).chunk : session.write(html)
      }
    })
  }
}
