import Rule from '../rule'

export default class extends Rule {
    static override id: 'VerticalAlign' = 'VerticalAlign' as const
    static override matches = /^(?:v|vertical):./
}