import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import UtilityType from '@master/css-schema/utility-type'
import type { ValueComponent, Variable } from '@master/css-schema/css-syntax'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { getMdnPropertySyntax } from './utils/mdn-css-data'

export type { ValueComponent, Variable }
export const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
export { UtilityType }

export function matchesLanguageServiceNativeDeclaration({ property }: { property: string }) {
  return property.startsWith('--') || Boolean(getMdnPropertySyntax(property))
}

export const SELECTOR_SIGNS = [':', '_', '>', '+', '~']
export const QUERY_COMPARISON_OPERATORS = ['>', '<', '=']
export const QUERY_LOGICAL_OPERATORS = ['&']
export const DELIMITER_SIGN = '|'
export const SEPARATOR_SIGN = ','
export const AT_SIGN = '@'
export const CLASS_ATTRIBUTES = ['class', 'className']
export const CLASS_DECLARATIONS: string[] = []
export const CLASS_FUNCTIONS = ['clsx', 'cva', 'ctl', 'cv', 'class', 'classnames', 'classVariant', 'styled(?:\\s+)?(?:\\.\\w+)?', 'classList(?:\\s+)?\\.(?:add|remove|toggle|replace)']
