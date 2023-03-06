import { Rule } from '../rule'

export class TextStroke extends Rule {
    static id = 'TextStroke' as const
    static matches = '^text-stroke:.'
    static get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke': declaration
        }
    }
}