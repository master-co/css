import Rule from '../rule'

export default class extends Rule {
    static override id: 'PlaceContent' = 'PlaceContent' as const
    override order = -1
}