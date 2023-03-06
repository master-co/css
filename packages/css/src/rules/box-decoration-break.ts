import { Rule } from '../rule'

export class BoxDecorationBreak extends Rule {
    static override id = 'BoxDecorationBreak' as const
    static override matches = '^box:(?:slice|clone|$values)(?!\\|)'
    override get(declaration): { [key: string]: any } {
        return {
            'box-decoration-break': declaration,
            '-webkit-box-decoration-break': declaration
        }
    }
}