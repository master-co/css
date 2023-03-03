import { Rule } from '../'

export class Lines extends Rule {
    static override id = 'Lines' as const
    static override matches = '^lines:.'
    static override unit = ''
    static override get prop() { return '' }
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