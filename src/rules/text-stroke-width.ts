import Rule from '../rule'

export default class extends Rule {
    static override id = 'TextStrokeWidth'
    static override matches = /^text-stroke(:((thin|medium|thick)(?!\|)|\.?\d((?!\|).)*$)|-width:.)/
    static override prop = ''
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke-width': declaration
        }
    }
}