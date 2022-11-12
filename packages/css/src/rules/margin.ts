import Rule from '../rule'

export default class extends Rule {
    static override id: 'Margin' = 'Margin' as const
    static override matches = /^margin(-(left|right|top|bottom))?:./
    static override prop = ''
    override get(declaration): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: declaration
        }
    }
    override get order(): number {
        return (this.prefix === 'margin' + ':') ? -1 : 0
    }
}