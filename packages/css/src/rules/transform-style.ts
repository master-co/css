import { RuleConfig } from '../rule'

export const transformStyle: RuleConfig = {
    matches: '^transform:(?:flat|preserve-3d|$values)(?!\\|)'
}