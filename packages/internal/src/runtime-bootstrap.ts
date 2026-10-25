export const MASTER_CSS_RUNTIME_BOOTSTRAP_ID = 'virtual:master-css-runtime'
export const RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID = `\0${MASTER_CSS_RUNTIME_BOOTSTRAP_ID}`

export interface MasterCSSRuntimeBootstrapOptions {
  /** Expression for the runtime `stylesheetDelivery` option. */
  readonly stylesheetDelivery?: string
  /** Progressive pages defer the engine, so the project manifest loads only if it starts. */
  readonly progressive?: boolean
}

export function createMasterCSSRuntimeBootstrapSource({ stylesheetDelivery, progressive }: MasterCSSRuntimeBootstrapOptions = {}) {
  return [
    `import { MasterCSSRuntime } from '@master/css-runtime'`,
    ...(progressive
      ? []
      : [`import masterCSSManifest from 'virtual:master-css-manifest'`]),
    `import masterCSSEmittedGlobals from 'virtual:master-css-emitted-globals'`,
    ``,
    `let masterCSSRuntime`,
    progressive
      ? `let currentManifest = () => import('virtual:master-css-manifest').then(module => module.default)`
      : `let currentManifest = masterCSSManifest`,
    `let currentEmittedGlobals = masterCSSEmittedGlobals`,
    `let startGeneration = 0`,
    `let pendingStart = import.meta.hot?.data.pendingRuntimeStart ?? Promise.resolve()`,
    ``,
    `function disposeRuntime() {`,
    `  startGeneration++`,
    `  masterCSSRuntime?.dispose()`,
    `  masterCSSRuntime = undefined`,
    `}`,
    ``,
    `async function startRuntime(manifest = currentManifest, emittedGlobals = currentEmittedGlobals) {`,
    `  if (typeof document === 'undefined') return`,
    `  if (masterCSSRuntime) {`,
    `    // A manifest loader means only emitted globals changed.`,
    `    masterCSSRuntime.refresh(typeof manifest === 'function' ? undefined : manifest, emittedGlobals)`,
    `    return`,
    `  }`,
    `  disposeRuntime()`,
    `  const generation = startGeneration`,
    `  const startup = pendingStart.catch(() => {}).then(async () => {`,
    `    if (generation !== startGeneration) return`,
    `    const nextRuntime = await MasterCSSRuntime.start({`,
    `      manifest,`,
    `      emittedGlobals,`,
    ...(stylesheetDelivery ? [`      stylesheetDelivery: ${stylesheetDelivery},`] : []),
    `      onDiagnostic: diagnostic => console.error(diagnostic)`,
    `    })`,
    `    if (generation !== startGeneration) {`,
    `      nextRuntime.dispose()`,
    `      return`,
    `    }`,
    `    masterCSSRuntime = nextRuntime.observe()`,
    `  })`,
    `  pendingStart = startup`,
    `  await startup`,
    `}`,
    ``,
    `if (typeof document !== 'undefined') {`,
    `  void startRuntime().catch(error => console.error(error, error?.cause))`,
    `}`,
    ``,
    `if (import.meta.hot) {`,
    `  import.meta.hot.accept(() => {})`,
    `  import.meta.hot.accept([`,
    `    'virtual:master-css-manifest',`,
    `    'virtual:master-css-emitted-globals'`,
    `  ], ([manifestModule, emittedGlobalsModule]) => {`,
    `    currentManifest = manifestModule?.default ?? currentManifest`,
    `    currentEmittedGlobals = emittedGlobalsModule?.default ?? currentEmittedGlobals`,
    `    void startRuntime().catch(error => console.error(error, error?.cause))`,
    `  })`,
    `  import.meta.hot.dispose(data => {`,
    `    disposeRuntime()`,
    `    data.pendingRuntimeStart = pendingStart`,
    `  })`,
    `}`,
    ``
  ].join('\n')
}

/** Resolve the public delivery contract before any adapter injects code. */
export function resolveIntegrationRuntime(
  mode: import('@master/css-schema/integration').MasterCSSRenderingMode,
  runtime: boolean | import('@master/css-schema/integration').MasterCSSIntegrationRuntimeOptions | undefined
) {
  const options = typeof runtime === 'object' ? runtime : { enabled: runtime }
  const enabled = mode === 'runtime' || mode === 'progressive'
  if (options.enabled !== undefined && options.enabled !== enabled) {
    throw new TypeError(`Master CSS mode "${mode}" requires runtime.enabled=${enabled}. Select a consistent rendering mode.`)
  }
  return { ...options, enabled }
}
