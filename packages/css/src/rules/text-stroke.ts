import { RuleConfig } from '..'

export const textStroke: RuleConfig = {
    matches: '^text-stroke:.',
    prop: false,
    get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke': declaration
        }
    }
}