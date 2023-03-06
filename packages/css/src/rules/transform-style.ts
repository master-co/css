import { RuleConfig } from '..'

export const transformStyle: RuleConfig = {
    matches: '^transform:(?:flat|preserve-3d|$values)(?!\\|)'
}