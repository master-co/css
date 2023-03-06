import { RuleConfig } from '../rule'

export const textAlign: RuleConfig = {
    matches: '^t(?:ext)?:(?:justify|center|left|right|start|end|$values)(?!\\|)'
}