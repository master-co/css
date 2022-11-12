import Rule from '../rule'

export default class extends Rule {
    static override id: 'ScrollSnapType' = 'ScrollSnapType' as const
    static override matches = /^scroll-snap:(([xy]|block|inline|both)(\|(proximity|mandatory))?)(?!\|)/
}