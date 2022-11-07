import Rule from '../rule'

export default class extends Rule {
    static override id = 'TransformStyle'
    static override matches = /^transform:(flat|preserve-3d)(?!\|)/
}