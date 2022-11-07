import Rule from '../rule'

export default class extends Rule {
    static override id = 'ScrollSnapStop'
    static override matches = /^scroll-snap:(normal|always)(?!\|)/
}