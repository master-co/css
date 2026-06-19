import { MASTER_CSS_VALUE_UNIT_PATTERN, MASTER_CSS_VALUE_UNITS } from '@master/css-lexer'
import type { MasterCSSPlanAtIdentifier } from 'shared/master-css-plan'

export const VALUE_DELIMITERS = {
    '(': ')',
    '\'': '\'',
    '"': '"',
    '{': '}'
}
export const BASE_UNIT_REGEX = /^([+-]?(?:\d+(?:\.?\d+)?|\.\d+))x$/m // 1x, 1.1x, -1x, -.1x
export const SELECTOR_SIGNS = [':', '_', '>', '+', '~']
export const SELECTOR_COMBINATORS = ['_', '>', '+', '~']
export const QUERY_COMPARISON_OPERATORS = ['>', '<', '=']
export const QUERY_LOGICAL_OPERATORS = ['&']
export const SEPARATOR_SIGNS = [',', '|']
export const DELIMITER_SIGN = '|'
export const SEPARATOR_SIGN = ','
export const AT_SIGN = '@'
export const VALUE_UNITS = [...MASTER_CSS_VALUE_UNITS]
export const UNIT_REGEX = new RegExp(`^([+-.]?\\d+(?:\\.?\\d+)?)(${MASTER_CSS_VALUE_UNIT_PATTERN})?$`)
export const CLASS_ATTRIBUTES = ['class', 'className']
export const CLASS_DECLARATIONS = []
export const CLASS_FUNCTIONS = ['clsx', 'cva', 'ctl', 'cv', 'class', 'classnames', 'classVariant', 'styled(?:\\s+)?(?:\\.\\w+)?', 'classList(?:\\s+)?\\.(?:add|remove|toggle|replace)']
export const BORDER_STYLE_VALUES = ['none', 'auto', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']
export const AT_COMPARISON_OPERATORS = ['>=', '<=', '>', '<', '=']
export const AT_LOGICAL_OPERATORS = {
    '&': 'and',
    '!': 'not',
    // native
    'not': 'not',
    'and': 'and',
    'or': 'or',
    'only': 'only',
    ',': 'or',

}
// the order is intentional and should not be changed
export const AT_IDENTIFIERS: MasterCSSPlanAtIdentifier[] = ['container', 'starting-style', 'supports', 'media', 'layer']
export const COMPARISION_OPERATORS = ['>=', '<=', '>', '<', '=']
export const AT_COMPARABLE_FEATURES = ['width', 'height', 'resolution']
export const AT_FEATURE_ALIASES = {
    w: 'width',
    h: 'height'
} as const
export const __UNSORTED__ = '__UNSORTED__'
