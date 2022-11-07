import Rule from '../rule'

export default class extends Rule {
    static override id = 'TextDecoration'
    static override matches = /^t(ext)?:(underline|line-through|overline)/
    static override colorful = true
    override order = -1
}