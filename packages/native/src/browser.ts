import type {
  LoadedNativeBinding,
  LoadNativeBindingOptions
} from './index'

/** Browser-safe resolution target for universal engine bundles. */
export function loadNativeBinding(
  options: LoadNativeBindingOptions = {}
): LoadedNativeBinding | undefined {
  if (!options.required) return
  throw Object.assign(
    new Error('Master CSS native bindings are unavailable in browsers.'),
    { code: 'NATIVE_UNAVAILABLE' as const }
  )
}
