import Rule from '../rule'

export default class extends Rule {
    static override id = 'TextTransform'
    static override matches = /^t(ext)?:(uppercase|lowercase|capitalize)(?!\|)/
}