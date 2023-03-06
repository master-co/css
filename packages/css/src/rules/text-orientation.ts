import { RuleConfig } from '../rule'

export const textOrientation: RuleConfig = {
    matches: '^t(?:ext)?:(?:mixed|upright|sideways-right|sideways|use-glyph-orientation|$values)(?!\\|)'
}