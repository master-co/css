import { RuleConfig } from '../rule'

export const textTransform: RuleConfig = {
    matches: '^t(?:ext)?:(?:uppercase|lowercase|capitalize|$values)(?!\\|)'
}