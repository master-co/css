import Rule from '../rule'

export default class extends Rule {
    static override id = 'TextDecorationColor'
    static override colorStarts = 'text-decoration:'
    static override colorful = true
}