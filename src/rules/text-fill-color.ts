import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'TextFillColor'
    static override matches = /^text-fill-color:./
    static override colorStarts = '(text-fill|text|t):'
    static override colorful = true
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-fill-color': declaration
        }
    }
}