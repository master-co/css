import Rule from '../rule'

export default class extends Rule {
    static override id = 'MaxWidth' as const
    static override matches = '^max-w:.'
}