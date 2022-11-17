import Rule from '../rule'

export default class extends Rule {
    static override id = 'AlignContent' as const
    static override matches = '^ac:.'
}