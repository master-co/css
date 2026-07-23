import type { MasterCSSGeneratedRuleIR } from '@master/css-schema/hydration-manifest'

export interface MasterCSSClassValidation {
  readonly className: string
  readonly matched: boolean
  readonly rules: readonly MasterCSSGeneratedRuleIR[]
}

export interface MasterCSSClassValidationResult {
  readonly version: 1
  readonly classes: readonly MasterCSSClassValidation[]
}
