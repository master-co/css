import { RuleConfig } from '../rule'

export const backgroundSize: RuleConfig = {
    matches: '^(?:bg|background):(?:\\.?\\[0-9]+|auto|cover|contain|$values)(?!\\|)'
}