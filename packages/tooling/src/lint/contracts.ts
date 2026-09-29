export interface RawValuePolicyOptions {
  allowRawValues?: boolean
  allowProperties?: readonly string[]
  allowedPatterns?: readonly string[]
}

export interface CanonicalClassNameOptions {
  preferStaticUtilities?: boolean
  preferCompositionUtilities?: boolean
}

export const defaultCanonicalClassNameOptions: Readonly<Required<CanonicalClassNameOptions>> = Object.freeze({
  preferStaticUtilities: true,
  preferCompositionUtilities: true,
})
