import { Rule } from '../'

export class Inset extends Rule {
    static override id = 'Inset' as const
    static override matches = '^(?:top|bottom|left|right):.'
    override get(declaration): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: declaration
        }
    }
}