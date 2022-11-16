import Rule from '../rule'

export default class extends Rule {
    static override id: 'TransformStyle' = 'TransformStyle' as const
    static override matches = /^transform:(flat|preserve-3d)(?!\|)/
}