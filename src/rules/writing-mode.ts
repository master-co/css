import Rule from '../rule'

export default class extends Rule {
    static override id: 'WritingMode' = 'WritingMode' as const
    static override matches = /^writing:./
}