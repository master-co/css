import { RuleConfig } from '../rule'

export const transformBox: RuleConfig = {
    matches: '^transform:(?:$values)(?!\\|)'
}