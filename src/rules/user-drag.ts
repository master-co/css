import Rule from '../rule'

export default class extends Rule {
    static override id = 'UserDrag'
    override get(declaration): { [key: string]: any } {
        return {
            'user-drag': declaration,
            '-webkit-user-drag': declaration
        }
    }
}