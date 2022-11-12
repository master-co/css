import Rule from '../rule'

export default class extends Rule {
    static override id: 'CaretColor' = 'CaretColor' as const
    static override colorStarts = 'caret:'
    static override colorful = true
}