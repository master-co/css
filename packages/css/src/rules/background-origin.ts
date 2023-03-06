import { Rule } from '../rule'

export class BackgroundOrigin extends Rule {
    static override id = 'BackgroundOrigin' as const
    static override matches = '^(?:bg|background):(?:$values)(?!\\|)'
}