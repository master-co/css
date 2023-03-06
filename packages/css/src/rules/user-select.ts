import { RuleConfig } from '..'

export const userSelect: RuleConfig = {
    get(declaration): { [key: string]: any } {
        return {
            'user-select': declaration,
            '-webkit-user-select': declaration
        }
    }
}