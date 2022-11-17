import Rule from '../rule'

export default class extends Rule {
    static override id = 'Display' as const
    static override matches = '^d:.'
}