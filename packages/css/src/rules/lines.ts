import Rule from '../rule'

export default class extends Rule {
    static override id: 'Lines' = 'Lines' as const
    static override matches = /^lines:./
    static override unit = ''
    static override prop = ''
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