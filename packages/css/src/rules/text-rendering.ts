import { RuleConfig } from '../rule'

export const textRendering: RuleConfig = {
    matches: '^t(?:ext)?:(?:optimizeSpeed|optimizeLegibility|geometricPrecision|$values)(?!\\|)'
}