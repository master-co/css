import { RuleConfig } from '..'

export const backgroundAttachment: RuleConfig = {
    matches: '^(?:bg|background):(?:fixed|local|scroll|$values)(?!\\|)'
}