import { RuleConfig } from '..'

export const textRendering: RuleConfig = {
    matches: '^t(?:ext)?:(?:optimizeSpeed|optimizeLegibility|geometricPrecision|$values)(?!\\|)'
}