import Rule from '../rule'

export default class extends Rule {
    static override id = 'AccentColor'
    static override colorStarts = 'accent:'
    static override colorful = true
}