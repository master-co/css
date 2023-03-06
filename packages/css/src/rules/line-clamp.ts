import { RuleConfig } from '../rule'

export const lineClamp: RuleConfig = {
    unit: '',
    get(declaration): { [key: string]: any } {
        return {
            '-webkit-line-clamp': declaration
        }
    }
}