import Rule from '../rule'

export default class extends Rule {
    static override id: 'WordSpacing' = 'WordSpacing' as const
    static override unit = 'em'
}