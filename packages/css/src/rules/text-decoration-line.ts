import Rule from '../rule'

export default class extends Rule {
    static override id: 'TextDecorationLine' = 'TextDecorationLine' as const
    static override matches = /^t(ext)?:(none|underline|overline|line-through)(?!\|)/
}