import { MasterCSSRuntime, type MasterCSSRuntimeOptions } from '@master/css-runtime'
// @ts-expect-error virtual module
import emittedGlobals from 'virtual:master-css-emitted-globals'

export async function startMasterCSSRuntime(program: MasterCSSRuntimeOptions['program']) {
  try {
    const cssRuntime = await MasterCSSRuntime.start({
      program,
      emittedGlobals,
      onDiagnostic: diagnostic => console.error(diagnostic)
    })
    cssRuntime.observe()
  } catch {
    // MasterCSSRuntime.start() already reports a structured error and fails open.
  }
}
