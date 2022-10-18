import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'Lines'
    static override matches = /^lines:./
    static override unit = ''
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