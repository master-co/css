import { Rule } from '../'

export default class extends Rule {
    static override id = 'UserSelect' as const
    override get(declaration): { [key: string]: any } {
        return {
            'user-select': declaration,
            '-webkit-user-select': declaration
        }
    }
}