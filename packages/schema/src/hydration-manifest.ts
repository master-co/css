import type { MasterCSSManifestUtilityLayerName } from './manifest.js'
import type { UtilityType } from './utility-type.js'

export const MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID = 'master-css-hydration-manifest'
export const MASTER_CSS_HYDRATION_MANIFEST_ATTR = 'data-master-css-hydration-manifest'
export const MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE = '/_master-css/hydration/'
export const MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME = 'master-css-hydration'

export interface MasterCSSRulePriority {
  /** Token values sort before raw values within the same cascade tier. */
  readonly valuePriority?: -1 | 0
  /** Parsed declaration identity, independent of public aliases. */
  readonly sortKey?: string
  readonly features?: readonly (readonly [string, number, number])[]
  readonly conditions?: readonly string[]
  readonly selector: number
}

export interface MasterCSSHydrationRuleNode {
  readonly text: string
}

export interface MasterCSSHydrationRule {
  readonly className: string
  readonly key: string
  readonly layer: MasterCSSManifestUtilityLayerName
  readonly type: UtilityType
  readonly sortTier: number
  readonly priority: MasterCSSRulePriority
  readonly text: string
  readonly nodes?: readonly MasterCSSHydrationRuleNode[]
  readonly selectorText?: string
  readonly variableNames?: readonly string[]
  readonly animationNames?: readonly string[]
}

export interface MasterCSSHydrationManifest {
  readonly version: 1
  readonly languageVersion: 2
  readonly rules: readonly MasterCSSHydrationRule[]
  readonly resourceOrder: readonly string[]
}

export function serializeMasterCSSHydrationManifest(hydrationManifest: MasterCSSHydrationManifest) {
  return JSON.stringify(hydrationManifest).replace(/</g, '\\u003c')
}

export function createMasterCSSHydrationManifestScript(hydrationManifest: MasterCSSHydrationManifest) {
  return `<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">${serializeMasterCSSHydrationManifest(hydrationManifest)}</script>`
}
