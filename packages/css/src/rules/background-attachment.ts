import { RuleConfig } from '../rule'

export const backgroundAttachment: RuleConfig = {
    matches: '^(?:bg|background):(?:fixed|local|scroll|$values)(?!\\|)'
}