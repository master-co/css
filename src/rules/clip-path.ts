import Rule from '../rule'

export default class extends Rule {
    static override id = 'ClipPath'
    static override matches = /^clip:./
}