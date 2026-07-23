import { getMdnPropertySyntax } from './utils/mdn-css-data'

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
