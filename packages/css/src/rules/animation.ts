import Rule from '../rule'

export default class extends Rule {
    static override id: 'Animation' = 'Animation' as const
    static override symbol = '@' 
    static override unit = ''
    override order = -1
}