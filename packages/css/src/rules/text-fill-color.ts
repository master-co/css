import { Rule } from '../rule'

export class TextFillColor extends Rule {
    static id = 'TextFillColor' as const
    static matches = '^text-fill-color:.'
    static colorStarts = '(?:text-fill|text|t):'
    static colorful = true
    static get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-fill-color': declaration
        }
    }
}