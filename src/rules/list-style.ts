import Rule from '../rule'

export default class extends Rule {
    static override id: 'ListStyle' = 'ListStyle' as const
    override order = -1
}