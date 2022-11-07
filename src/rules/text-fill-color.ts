import Rule from '../rule'

export default class extends Rule {
    static override id = 'TextFillColor'
    static override matches = /^text-fill-color:./
    static override colorStarts = '(text-fill|text|t):'
    static override colorful = true
    static override prop = ''
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-fill-color': declaration
        }
    }
}