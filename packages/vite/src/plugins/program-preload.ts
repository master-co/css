import type { Plugin } from 'vite'
import {
  PROGRAM_ASSET_FILE,
  toProgramPreloadLinkAttrs
} from '@master/css-internal/program-module'
import type { MasterCSSVitePluginContext } from '../core'
import { hasFetchPreloadLink, toAssetHref } from '../utils/html'

interface OutputAssetLike {
  type: string
  name?: string
  names?: string[]
  fileName?: string
  source?: unknown
}

function sameBytes(left: unknown, right: Uint8Array) {
  return left instanceof Uint8Array
    && left.length === right.length
    && left.every((byte, index) => byte === right[index])
}

function findDefaultProgramAssetFileName(context: MasterCSSVitePluginContext, bundle: Record<string, OutputAssetLike>) {
  const source = context.defaultProgramAssetSource
  if (!source) return
  for (const output of Object.values(bundle)) {
    if (
      output.type === 'asset'
      && (output.name === PROGRAM_ASSET_FILE || output.names?.includes(PROGRAM_ASSET_FILE))
      && sameBytes(output.source, source)
    ) {
      return output.fileName
    }
  }
}

/** Runtime-mode pages start fetching the runtime program with the HTML. */
export default function ProgramPreloadPlugin(context: MasterCSSVitePluginContext): Plugin {
  return {
    name: 'master-css:program-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, htmlContext) {
        if (!context.defaultProgramAssetReferenceId || !htmlContext.bundle) return
        const fileName = findDefaultProgramAssetFileName(context, htmlContext.bundle as Record<string, OutputAssetLike>)
        if (!fileName) return
        const href = toAssetHref(fileName, context.config?.base, htmlContext.path)
        if (hasFetchPreloadLink(html, href)) return
        return {
          html,
          tags: [
            {
              tag: 'link',
              attrs: { ...toProgramPreloadLinkAttrs(href) },
              injectTo: 'head-prepend'
            }
          ]
        }
      }
    }
  }
}
