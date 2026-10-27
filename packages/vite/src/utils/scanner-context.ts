import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { defaultBuildManifest } from '@master/css-internal/project'
import type { ResolvedConfig } from 'vite'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'
import type { MasterCSSVitePluginContext } from '../core'

export function getScanner(context: MasterCSSVitePluginContext): MasterCSSScanner {
  if (!context.scanner) {
    throw new Error('[@master/css-vite] Scanner context was not initialized.')
  }
  return context.scanner
}

interface ScannerState {
  environments?: Set<object>
  closedEnvironments?: WeakSet<object>
  getEnvironments?: () => Iterable<object>
  scanner?: MasterCSSScanner
  initializing?: Promise<MasterCSSScanner>
  disposing?: Promise<void>
  stylesheets?: MasterCSSVitePluginContext['stylesheets']
}

const scannerStates = new WeakMap<MasterCSSVitePluginContext, WeakMap<ResolvedConfig, ScannerState>>()
const currentStates = new WeakMap<MasterCSSVitePluginContext, ScannerState>()

export async function ensureScanner(options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Promise<MasterCSSScanner> {
  const config = context.config
  if (!config) {
    throw new Error('[@master/css-vite] Cannot initialize the scanner before Vite config is resolved.')
  }
  let states = scannerStates.get(context)
  if (!states) { states = new WeakMap();scannerStates.set(context, states) }
  let state = states.get(config)
  if (state?.disposing) { await state.disposing;return ensureScanner(options, context) }
  if (!state) {
    // Vite creates the replacement server before closing the previous one.
    // Preserve the old collection with its owner before publishing new state.
    const previous = currentStates.get(context)
    if (previous) previous.stylesheets = context.stylesheets
    context.scanner = undefined
    context.stylesheets = undefined
    state = {}
    states.set(config, state)
    currentStates.set(context, state)
  }
  if (state.scanner) return state.scanner
  if (state.initializing) return state.initializing
  const owner = state
  const scanner = new MasterCSSScanner({ manifest: defaultBuildManifest, ...options.scanner, outputDirectories: [...(options.scanner?.outputDirectories ?? []), ...(config.build?.outDir ? [config.build.outDir] : [])] }, config.root)
  owner.initializing = scanner.init()
    .then(() => {
      scanner.options.verbose = 0
      owner.scanner = scanner
      if (currentStates.get(context) === owner && !owner.disposing) context.scanner = scanner
      return scanner
    })
    .catch(async (error) => {
      await scanner.dispose()
      if (states.get(config) === owner) states.delete(config)
      throw error
    })
    .finally(() => { owner.initializing = undefined })
  return owner.initializing
}

/** Observe the public server registry, including idle replacement environments. */
export function trackScannerEnvironments(context: MasterCSSVitePluginContext, config: ResolvedConfig, getEnvironments: () => Iterable<object>) {
  const owner = scannerStates.get(context)?.get(config)
  if (owner) {
    owner.environments = new Set(getEnvironments())
    owner.closedEnvironments = new WeakSet()
    owner.getEnvironments = getEnvironments
  }
}

/** Both scanner and HMR cleanup may release the same environment; deletion is idempotent. */
export function releaseScannerEnvironment(context: MasterCSSVitePluginContext, config: ResolvedConfig | undefined, environment?: object) {
  const owner = config && scannerStates.get(context)?.get(config)
  if (!environment || !owner?.environments) return true
  owner.closedEnvironments?.add(environment)
  for (const current of owner.getEnvironments?.() ?? []) {
    if (!owner.closedEnvironments?.has(current)) owner.environments.add(current)
  }
  owner.environments.delete(environment)
  return owner.environments.size === 0
}

export async function disposeScanner(context: MasterCSSVitePluginContext, config = context.config) {
  if (!config) return
  const states = scannerStates.get(context), owner = states?.get(config)
  if (!owner) return
  if (owner.disposing) return owner.disposing
  if (currentStates.get(context) === owner) {
    owner.stylesheets = context.stylesheets
    context.scanner = undefined
    context.stylesheets = undefined
    currentStates.delete(context)
  }
  owner.disposing = (async () => {
    // A close during initialization must still release the initialized scanner.
    try { await owner.initializing } catch { /* Initialization releases failed scanners. */ }
    const scanner = owner.scanner
    owner.scanner = undefined
    try { await scanner?.dispose() } finally { owner.stylesheets?.dispose();owner.stylesheets = undefined }
  })().finally(() => { if (states?.get(config) === owner) states.delete(config) })
  return owner.disposing
}
