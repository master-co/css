import { Rule } from '../rule'

export class Lines extends Rule {
    static id = 'Lines' as const
    static matches = '^lines:.'
    static unit = ''
    static get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return {
            overflow: { ...declaration, value: 'hidden' },
            display: { ...declaration, value: '-webkit-box' },
            'overflow-wrap': { ...declaration, value: 'break-word' },
            'text-overflow': { ...declaration, value: 'ellipsis' },
            '-webkit-box-orient': { ...declaration, value: 'vertical' },
            '-webkit-line-clamp': declaration
        }
    }
}