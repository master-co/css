import type {
  LoadedNativeBinding,
  LoadNativeBindingOptions
} from './index'
import { NativeBindingError } from './errors'

export { NativeBindingError, type NativeLoadFailureCode } from './errors'

/** Browser-safe resolution target for universal engine bundles. */
export function loadNativeBinding(
  options: LoadNativeBindingOptions = {}
): LoadedNativeBinding | undefined {
  if (!options.required) return
  throw new NativeBindingError(
    'NATIVE_UNAVAILABLE',
    'Master CSS native bindings are unavailable in browsers.'
  )
}
