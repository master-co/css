import Rule from '../rule'

export default class extends Rule {
    static override id = 'ListStylePosition' as const
    static override matches = '^list-style:(?:inside|outside|$values)(?!\\|)'
}