import { Rule } from '../rule'

export class LineClamp extends Rule {
    static id = 'LineClamp' as const
    static unit = ''
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-line-clamp': declaration
        }
    }
}