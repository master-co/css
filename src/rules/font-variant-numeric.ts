import Rule from '../rule'

export default class extends Rule {
    static override id = 'FontVariantNumeric'
    static override matches = /^f(ont)?:(ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stacked-fractions)(?!\|)/
}