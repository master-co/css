import Rule from '../rule'

export default class extends Rule {
    static override id = 'ScrollSnapAlign'
    static override matches = /^scroll-snap:(start|end|center)/
}