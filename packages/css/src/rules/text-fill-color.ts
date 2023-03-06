import { RuleConfig } from '..'

export const textFillColor: RuleConfig = {
    matches: '^text-fill-color:.',
    colorStarts: '(?:text-fill|text|t):',
    colorful: true,
    prop: false,
    get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-fill-color': declaration
        }
    }
}