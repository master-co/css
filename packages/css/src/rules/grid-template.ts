import Rule from '../rule'

export default class extends Rule {
    static override id: 'GridTemplate' = 'GridTemplate' as const
    override order = -1
}