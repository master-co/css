import { Rule } from '../rule'

export class BackgroundOrigin extends Rule {
    static id = 'BackgroundOrigin' as const
    static matches = '^(?:bg|background):(?:$values)(?!\\|)'
}