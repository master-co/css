import { Rule } from '../rule'

export class TextStrokeWidth extends Rule {
    static id = 'TextStrokeWidth' as const
    static matches = '^text-stroke(:(thin|medium|thick|\\.?[0-9]+|$values)(?!\\|)|-width:.)'
    static get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke-width': declaration
        }
    }
}