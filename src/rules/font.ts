import Rule from '../rule'

export default class extends Rule {
    static override id = 'Font'
    static override matches = /^f:./
    static override unit = ''
    override order = -1
}