import Rule from '../rule'

export default class extends Rule {
    static override id = 'ClipPath' as const
    static override matches = '^clip:.'
}