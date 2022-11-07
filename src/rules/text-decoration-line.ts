import Rule from '../rule'

export default class extends Rule {
    static override id = 'TextDecorationLine'
    static override matches = /^t(ext)?:(none|underline|overline|line-through)(?!\|)/
}