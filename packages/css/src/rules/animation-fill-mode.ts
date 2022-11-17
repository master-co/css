import Rule from '../rule'

export default class extends Rule {
    static override id = 'AnimationFillMode' as const
    static override matches = '^@fill-mode:.'
}