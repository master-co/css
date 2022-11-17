import Rule from '../rule'

export default class extends Rule {
    static override id = 'FontStyle' as const
    static override matches = '^f(?:ont)?:(?:normal|italic|oblique|$values)(?!\\|)'
    static override unit = 'deg'
}