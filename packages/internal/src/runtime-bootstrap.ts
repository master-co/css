export const MASTER_CSS_RUNTIME_BOOTSTRAP_ID = 'virtual:master-css-runtime'
export const RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID = `\0${MASTER_CSS_RUNTIME_BOOTSTRAP_ID}`

export interface MasterCSSRuntimeBootstrapOptions {
  /** Expression for the runtime `stylesheetDelivery` option. */
  readonly stylesheetDelivery?: string
  /** Progressive pages defer the engine, so the runtime program loads only if it starts. */
  readonly progressive?: boolean
}

export function createMasterCSSRuntimeBootstrapSource({ stylesheetDelivery, progressive }: MasterCSSRuntimeBootstrapOptions = {}) {
  return [
    `import { MasterCSSRuntime } from '@master/css-runtime'`,
    ...(progressive
      ? []
      : [`import masterCSSProgram from 'virtual:master-css-program'`]),
    `import masterCSSEmittedGlobals from 'virtual:master-css-emitted-globals'`,
    ``,
    `let masterCSSRuntime`,
    progressive
      ? `let currentProgram = () => import('virtual:master-css-program').then(module => module.default)`
      : `let currentProgram = masterCSSProgram`,
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
    `async function startRuntime(program = currentProgram, emittedGlobals = currentEmittedGlobals) {`,
    `  if (typeof document === 'undefined') return`,
    `  if (masterCSSRuntime) {`,
    `    // A program loader means only emitted globals changed.`,
    `    masterCSSRuntime.refresh(typeof program === 'function' ? undefined : program, emittedGlobals)`,
    `    return`,
    `  }`,
    `  disposeRuntime()`,
    `  const generation = startGeneration`,
    `  const startup = pendingStart.catch(() => {}).then(async () => {`,
    `    if (generation !== startGeneration) return`,
    `    const nextRuntime = await MasterCSSRuntime.start({`,
    `      program,`,
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
    `    'virtual:master-css-program',`,
    `    'virtual:master-css-emitted-globals'`,
    `  ], ([programModule, emittedGlobalsModule]) => {`,
    `    currentProgram = programModule?.default ?? currentProgram`,
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
