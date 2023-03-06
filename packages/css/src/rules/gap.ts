import { RuleConfig } from '..'

export const gap: RuleConfig = {
    matches: '^gap(?:-x|-y)?:.',
    order: -1,
    prop: false,
    get(declaration): { [key: string]: any } {
        switch (this.prefix[4]) {
        case 'x':
            return { 'column-gap': declaration }
        case 'y':
            return { 'row-gap': declaration }
        default:
            return { gap: declaration }
        }
    }
}