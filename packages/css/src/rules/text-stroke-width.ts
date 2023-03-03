import { Rule } from '../'

export class TextStrokeWidth extends Rule {
    static override id = 'TextStrokeWidth' as const
    static override matches = '^text-stroke(:(thin|medium|thick|\\.?[0-9]+|$values)(?!\\|)|-width:.)'
    static override get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke-width': declaration
        }
    }
}