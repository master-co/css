import Rule from '../rule'

export default class extends Rule {
    static override id = 'LineClamp'
    static override unit = ''
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-line-clamp': declaration
        }
    }
}