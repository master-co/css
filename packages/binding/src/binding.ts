import {
  MASTER_CSS_BINDING_ABI_VERSION,
  MASTER_CSS_DIAGNOSTICS_REPORT_VERSION,
  MASTER_CSS_ENGINE_TRANSITION_VERSION,
  MASTER_CSS_HYDRATION_MANIFEST_VERSION,
  MASTER_CSS_LANGUAGE_BATCH_VERSION,
  MASTER_CSS_LEXER_BATCH_VERSION,
  MASTER_CSS_SOURCE_BATCH_VERSION,
  MASTER_CSS_LINT_BATCH_VERSION,
  MASTER_CSS_MANIFEST_VERSION,
  MASTER_CSS_VALIDATOR_BATCH_VERSION,
  type MasterCSSBindingFeature,
  type MasterCSSBindingInfo,
  type MasterCSSBindingSurface
} from './protocol'

export interface MasterCSSBindingRequirements {
  surface: MasterCSSBindingSurface
  features?: readonly MasterCSSBindingFeature[]
  packageVersion?: string
}

export class MasterCSSBindingContractError extends Error {
  readonly code = 'BINDING_MISMATCH'

  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'MasterCSSBindingContractError'
  }
}

function parseBindingInfo(value: unknown): MasterCSSBindingInfo {
  if (!value || typeof value !== 'object') {
    throw new MasterCSSBindingContractError('Master CSS binding metadata must be an object.')
  }
  return value as MasterCSSBindingInfo
}

export function assertMasterCSSBindingInfo(
  value: unknown,
  requirements: MasterCSSBindingRequirements
): MasterCSSBindingInfo {
  const info = parseBindingInfo(value)
  const versionsMatch = info.bindingAbiVersion === MASTER_CSS_BINDING_ABI_VERSION
    && info.manifestVersion === MASTER_CSS_MANIFEST_VERSION
    && info.hydrationManifestVersion === MASTER_CSS_HYDRATION_MANIFEST_VERSION
    && info.engineTransitionVersion === MASTER_CSS_ENGINE_TRANSITION_VERSION
    && info.validatorBatchVersion === MASTER_CSS_VALIDATOR_BATCH_VERSION
    && info.diagnosticsReportVersion === MASTER_CSS_DIAGNOSTICS_REPORT_VERSION
    && info.lintBatchVersion === MASTER_CSS_LINT_BATCH_VERSION
    && info.languageBatchVersion === MASTER_CSS_LANGUAGE_BATCH_VERSION
    && info.lexerBatchVersion === MASTER_CSS_LEXER_BATCH_VERSION
    && info.sourceBatchVersion === MASTER_CSS_SOURCE_BATCH_VERSION
  const packageMatches = requirements.packageVersion === undefined
    || info.packageVersion === requirements.packageVersion
  const features = Array.isArray(info.features) ? new Set(info.features) : new Set<string>()
  const missingFeatures = (requirements.features || []).filter((feature) => !features.has(feature))

  if (!versionsMatch || !packageMatches || info.surface !== requirements.surface || missingFeatures.length) {
    throw new MasterCSSBindingContractError(
      `Master CSS ${requirements.surface} binding contract mismatch.`
      + (missingFeatures.length ? ` Missing features: ${missingFeatures.join(', ')}.` : '')
    )
  }
  return info
}
