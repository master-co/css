import { RuleConfig } from '..'

export const textOrientation: RuleConfig = {
    matches: '^t(?:ext)?:(?:mixed|upright|sideways-right|sideways|use-glyph-orientation|$values)(?!\\|)'
}