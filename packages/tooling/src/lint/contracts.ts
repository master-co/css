export interface RawValuePolicyOptions {
  allowRawValues?: boolean
  allowProperties?: string[]
  allowedPatterns?: string[]
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

export const defaultCanonicalClassNameOptions: Required<CanonicalClassNameOptions> = {
  preferStaticUtilities: true,
  preferThemeTokens: true,
  preferPropertyAliases: true,
  preferVariableReferences: true,
  preferMultiValueTokens: true,
  preferCompositionUtilities: true,
  preferConditionOrder: true,
  preferNativeDeclarationsInCompose: true,
  preferVariantBlocksInCompose: true
}

export interface CanonicalComposeDirectiveSuggestion {
  actual: string
  recommended: string
  classNames: string[]
  kind: 'class' | 'native-declaration' | 'variant-block'
}

export interface CanonicalComposeDirectiveResult {
  suggestions: CanonicalComposeDirectiveSuggestion[]
  structuralChange?: boolean
  replacement?: string
}
