import Rule from '../rule'

export default class extends Rule {
    static override id: 'PlaceItems' = 'PlaceItems' as const
    override order = -1
}