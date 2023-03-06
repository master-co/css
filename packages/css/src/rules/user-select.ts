import { Rule } from '../rule'

export class UserSelect extends Rule {
    static id = 'UserSelect' as const
    override get(declaration): { [key: string]: any } {
        return {
            'user-select': declaration,
            '-webkit-user-select': declaration
        }
    }
}