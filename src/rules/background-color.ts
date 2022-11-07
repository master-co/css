import Rule from '../rule'

export default class extends Rule {
    static override id = 'BackgroundColor'
    static override colorStarts = '(bg|background):'
    static override unit = ''
    static override colorful = true
}