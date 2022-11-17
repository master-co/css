import Rule from '../rule'

export default class extends Rule {
    static override id = 'Padding' as const
    static override matches = '^padding(?:-(?:left|right|top|bottom))?:.'
    static override get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: declaration
        }
    }
    override get order(): number {
        return (this.prefix === 'padding' + ':') ? -1 : 0
    }
}