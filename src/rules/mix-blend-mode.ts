import Rule from '../rule'

export default class extends Rule {
    static override id = 'MixBlendMode'
    static override matches = /^blend:./
}