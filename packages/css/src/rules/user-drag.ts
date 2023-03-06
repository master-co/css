import { Rule } from '../rule'

export class UserDrag extends Rule {
    static id = 'UserDrag' as const
    override get(declaration): { [key: string]: any } {
        return {
            'user-drag': declaration,
            '-webkit-user-drag': declaration
        }
    }
}