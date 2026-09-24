import type { MasterCSSValidatorBatch as BindingBatch } from '@master/css-binding/tooling'
import type { MasterCSSHydrationRule } from '@master/css-schema/hydration-manifest'

export interface MasterCSSClassValidation {
  readonly className: string
  readonly matchStatus: BindingBatch['classes'][number]['matchStatus']
  readonly declarations: readonly import('../value-validation').DeclarationValidation[]
  readonly checks: readonly { readonly name: string, readonly version: string, readonly phase: import('@master/css-binding/tooling').MasterCSSDiagnostic['phase'] }[]
  readonly cssValueStatus: BindingBatch['classes'][number]['cssValueStatus']
  readonly browserSupport: BindingBatch['classes'][number]['browserSupport']
  readonly rules: readonly MasterCSSHydrationRule[]
  readonly diagnostics?: readonly import('@master/css-binding/tooling').MasterCSSDiagnostic[]
}

export interface MasterCSSClassValidationResult {
  readonly version: 2
  readonly classes: readonly MasterCSSClassValidation[]
}
