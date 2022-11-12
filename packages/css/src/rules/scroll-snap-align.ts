import Rule from '../rule'

export default class extends Rule {
    static override id: 'ScrollSnapAlign' = 'ScrollSnapAlign' as const
    static override matches = /^scroll-snap:(start|end|center)/
}