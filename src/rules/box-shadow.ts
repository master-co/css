import Rule from '../rule'

export default class extends Rule {
    static override id = 'BoxShadow'
    static override matches = /^s(?:hadow)?:./
    static override colorful = true
}