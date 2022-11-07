import Rule from '../rule'

export default class extends Rule {
    static override id = 'ScrollSnapType'
    static override matches = /^scroll-snap:(([xy]|block|inline|both)(\|(proximity|mandatory))?)(?!\|)/
}