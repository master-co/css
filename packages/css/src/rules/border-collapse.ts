import { RuleConfig } from '../rule'

export const borderCollapse: RuleConfig = {
    matches: '^b(?:order)?:(?:collapse|separate|$values)(?!\\|)'
}