import { Rule } from '../rule'

export default class extends Rule {
    static override id = 'PlaceSelf' as const
    override order = -1
}