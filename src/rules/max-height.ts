import Rule from '../rule'

export default class extends Rule {
    static override id: 'MaxHeight' = 'MaxHeight' as const
    static override matches = /^max-h:./
}