import { Rule } from '../rule'

export class BackgroundClip extends Rule {
    static override id = 'BackgroundClip' as const
    static override matches = '^(?:bg|background):(?:text|$values)(?!\\|)'
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-background-clip': declaration,
            'background-clip': declaration
        }
    }
}