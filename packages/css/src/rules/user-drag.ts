import { Rule } from '../'

export default class extends Rule {
    static override id = 'UserDrag' as const
    override get(declaration): { [key: string]: any } {
        return {
            'user-drag': declaration,
            '-webkit-user-drag': declaration
        }
    }
}