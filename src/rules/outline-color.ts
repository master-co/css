import Rule from '../rule'

export default class extends Rule {
    static override id = 'OutlineColor'
    static override colorStarts = 'outline:'
    static override colorful = true
}