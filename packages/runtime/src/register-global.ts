import type {
  MasterCSSRuntime as MasterCSSRuntimeClass,
  MasterCSSRuntimeFacade
} from './core'

declare global {
  var MasterCSSRuntime: typeof MasterCSSRuntimeClass
  var masterCSSRuntime: MasterCSSRuntimeFacade | undefined
}

export default function registerGlobal(Runtime: typeof MasterCSSRuntimeClass) {
  if (!globalThis.MasterCSSRuntime) globalThis.MasterCSSRuntime = Runtime
}
