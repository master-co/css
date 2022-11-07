import Rule from '../rule'

export default class extends Rule {
    static override id = 'Inset'
    static override matches = /^(?:top|bottom|left|right):./
    override get(declaration): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: declaration
        }
    }
}