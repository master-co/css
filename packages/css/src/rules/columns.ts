import Rule from '../rule'

export default class extends Rule {
    static override id: 'Columns' = 'Columns' as const
    static override matches = /^(columns|cols):./
    static override unit = ''
    override order = -1
}