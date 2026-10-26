import { VIRTUAL_MODULE_DIR } from '@master/css-internal/node'
import { PROGRAM_ASSET_FILE } from '@master/css-internal/program-module'

const VIRTUAL_PROGRAM_FILE = 'master-css-program.js'
const VIRTUAL_CSS_PROGRAM_SUFFIX = '.program.js'
const PROGRAM_ASSET_EXTENSION = '.bin'
const PROGRAM_ASSET_BASENAME = PROGRAM_ASSET_FILE.slice(0, -PROGRAM_ASSET_EXTENSION.length)
const PROGRAM_ASSET_REFERENCE = new RegExp(String.raw`${PROGRAM_ASSET_BASENAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\.[a-f0-9]{8}\.bin`, 'g')

interface ProgramSourceModule {
  resource?: string
  /** Scope hoisting removes a concatenation root from the compilation but keeps it here. */
  modules?: readonly ProgramSourceModule[]
  originalSource?: () => { source(): unknown } | null | undefined
}

function toVirtualModuleName(resource: string) {
  const normalized = resource.replace(/\\/g, '/')
  const index = normalized.lastIndexOf(`/${VIRTUAL_MODULE_DIR}/`)
  return index === -1 ? undefined : normalized.slice(index + VIRTUAL_MODULE_DIR.length + 2)
}

/**
 * The program assets that the program modules of a compilation fetch. Emitting
 * only these follows the module graph, so a detached or superseded program is
 * neither emitted nor preloaded.
 */
export function collectProgramAssetReferences(modules: Iterable<unknown> | undefined) {
  const fileNames = new Set<string>()
  let defaultFileName: string | undefined
  const visit = (module: ProgramSourceModule) => {
    for (const inner of module.modules ?? []) visit(inner)
    const name = module.resource && toVirtualModuleName(module.resource)
    if (!name || (name !== VIRTUAL_PROGRAM_FILE && !name.endsWith(VIRTUAL_CSS_PROGRAM_SUFFIX))) return
    const source = module.originalSource?.()?.source()
    for (const [fileName] of String(source ?? '').matchAll(PROGRAM_ASSET_REFERENCE)) {
      fileNames.add(fileName)
      if (name === VIRTUAL_PROGRAM_FILE) defaultFileName = fileName
    }
  }
  for (const module of modules ?? []) visit(module as ProgramSourceModule)
  return { defaultFileName, fileNames }
}
