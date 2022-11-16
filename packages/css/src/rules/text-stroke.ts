import Rule from '../rule'

export default class extends Rule {
    static override id: 'TextStroke' = 'TextStroke' as const
    static override matches = /^text-stroke:./
    static override get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke': declaration
        }
    }
}