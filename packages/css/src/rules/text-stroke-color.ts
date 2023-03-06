import { Rule } from '../rule'

export class TextStrokeColor extends Rule {
    static id = 'TextStrokeColor' as const
    static matches = '^text-stroke-color:.'
    static colorStarts = 'text-stroke:'
    static colorful = true
    static get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke-color': declaration
        }
    }
}