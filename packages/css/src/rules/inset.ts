import { Rule } from '../rule'

export class Inset extends Rule {
    static id = 'Inset' as const
    static matches = '^(?:top|bottom|left|right):.'
    override get(declaration): { [key: string]: any } {
        return {
            [this.prefix.slice(0, -1)]: declaration
        }
    }
}