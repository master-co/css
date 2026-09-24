import type { MasterCSSValidatorBatch as BindingBatch } from '@master/css-binding/tooling'
import type { MasterCSSHydrationRule } from '@master/css-schema/hydration-manifest'

export interface MasterCSSClassValidation {
  readonly className: string
  readonly matched: boolean
  readonly rules: readonly MasterCSSHydrationRule[]
  readonly diagnostics?: BindingBatch['classes'][number]['diagnostics']
}

export interface MasterCSSClassValidationResult {
  readonly version: 1
  readonly classes: readonly MasterCSSClassValidation[]
}
