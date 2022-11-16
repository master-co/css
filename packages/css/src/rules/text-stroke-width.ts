import Rule from '../rule'

export default class extends Rule {
    static override id: 'TextStrokeWidth' = 'TextStrokeWidth' as const
    static override matches = /^text-stroke(:((thin|medium|thick)(?!\|)|\.?\d((?!\|).)*$)|-width:.)/
    static override get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke-width': declaration
        }
    }
}