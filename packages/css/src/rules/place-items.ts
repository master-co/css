import { Rule } from '../'

export default class extends Rule {
    static override id = 'PlaceItems' as const
    override order = -1
}