import Rule from '../rule'

export default class extends Rule {
    static override id: 'TextStrokeColor' = 'TextStrokeColor' as const
    static override matches = /^text-stroke-color:./
    static override colorStarts = 'text-stroke:'
    static override colorful = true
    static override prop = ''
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke-color': declaration
        }
    }
}