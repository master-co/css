import { RuleConfig } from '../rule'

export const userDrag: RuleConfig = {
    get(declaration): { [key: string]: any } {
        return {
            'user-drag': declaration,
            '-webkit-user-drag': declaration
        }
    }
}