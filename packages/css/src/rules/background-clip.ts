import { Rule } from '../rule'

export class BackgroundClip extends Rule {
    static id = 'BackgroundClip' as const
    static matches = '^(?:bg|background):(?:text|$values)(?!\\|)'
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-background-clip': declaration,
            'background-clip': declaration
        }
    }
}