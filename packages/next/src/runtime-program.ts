import { compileRuntimeProgram } from '@master/css/node'
import { toProductionManifestJSON } from '@master/css-internal/manifest-module'
import { toInlineProgramModule } from '@master/css-internal/program-module'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

/**
 * Inlines the runtime program that browsers execute in place of the manifest.
 * Production programs compile from the provenance-free manifest, so build-host
 * paths never ship.
 */
export async function toRuntimeProgramModule(manifest: MasterCSSManifest, production: boolean) {
  const programManifest = production
    ? JSON.parse(toProductionManifestJSON(manifest)) as MasterCSSManifest
    : manifest
  return toInlineProgramModule(await compileRuntimeProgram(programManifest))
}
