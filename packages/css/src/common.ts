export const VALUE_DELIMITERS = {
    '(': ')',
    '\'': '\'',
    '"': '"',
    '{': '}'
}

export const BASE_UNIT_REGEX = /^([+-]?(?:\d+(?:\.?\d+)?|\.\d+))x$/m // 1x, 1.1x, -1x, -.1x
export const PROP_PREFIX_SYMBOLS = ['@', '~']
export const SELECTOR_SIGNS = [':', '_', '>', '+', '~']
export const AT_SIGN = '@'
export const UNIT_REGEX = /^([+-.]?\d+(\.?\d+)?)(%|cm|mm|q|in|pt|pc|px|em|rem|ex|rex|cap|rcap|ch|rch|ic|ric|lh|rlh|vw|svw|lvw|dvw|vh|svh|lvh|dvh|vi|svi|lvi|dvi|vb|svb|lvb|dvb|vmin|svmin|lvmin|dvmin|vmax|svmax|lvmax|dvmax|cqw|cqh|cqi|cqb|cqmin|cqmax|deg|grad|rad|turn|s|ms|hz|khz|dpi|dpcm|dppx|x|fr|db|st)?$/

export const IMAGE_VALUE_REGEX = /(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\(.*\)/
export const COLOR_VALUE_REGEX = /(?:#|(?:color|color-contrast|color-mix|hwb|lab|lch|oklab|oklch|rgb|rgba|hsl|hsla)\\(.*\\)|(?:\$colors)(?![a-zA-Z0-9-]))/
export const NUMBER_VALUE_REGEX = /(?:[\d.]|(?:max|min|calc|clamp)\(.*\))/