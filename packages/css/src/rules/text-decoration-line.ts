import { RuleConfig } from '../rule'

export const textDecorationLine: RuleConfig = {
    matches: '^t(?:ext)?:(?:none|underline|overline|line-through|$values)(?!\\|)'
}