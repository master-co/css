import Rule from '../rule'

export default class extends Rule {
    static override id = 'UserSelect'
    override get(declaration): { [key: string]: any } {
        return {
            'user-select': declaration,
            '-webkit-user-select': declaration
        }
    }
}