export interface RawValuePolicyOptions {
  allowRawValues?: boolean
  allowProperties?: readonly string[]
  allowedPatterns?: readonly string[]
}

export interface CanonicalClassNameOptions {
  preferStaticUtilities?: boolean
  preferThemeTokens?: boolean
  preferPropertyAliases?: boolean
  preferVariableReferences?: boolean
  preferMultiValueTokens?: boolean
  preferCompositionUtilities?: boolean
  preferConditionOrder?: boolean
  preferNativeDeclarationsInCompose?: boolean
  preferVariantBlocksInCompose?: boolean
}

export const defaultCanonicalClassNameOptions: Readonly<Required<CanonicalClassNameOptions>> = Object.freeze({
  preferStaticUtilities: true,
  preferThemeTokens: true,
  preferPropertyAliases: true,
  preferVariableReferences: true,
  preferMultiValueTokens: true,
  preferCompositionUtilities: true,
  preferConditionOrder: true,
  preferNativeDeclarationsInCompose: true,
  preferVariantBlocksInCompose: true
})

export interface CanonicalComposeDirectiveSuggestion {
  readonly actual: string
  readonly recommended: string
  readonly classNames: readonly string[]
  readonly kind: 'class' | 'native-declaration' | 'variant-block'
}

export interface CanonicalComposeDirectiveResult {
  readonly suggestions: readonly CanonicalComposeDirectiveSuggestion[]
  readonly structuralChange?: boolean
  readonly replacement?: string
}
