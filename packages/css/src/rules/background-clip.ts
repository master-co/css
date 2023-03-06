import { RuleConfig } from '../rule'

export const backgroundClip: RuleConfig = {
    matches: '^(?:bg|background):(?:text|$values)(?!\\|)',
    get(declaration): { [key: string]: any } {
        return {
            '-webkit-background-clip': declaration,
            'background-clip': declaration
        }
    }
}