import { Rule } from '../rule'

export class FontVariantNumeric extends Rule {
    static override id = 'FontVariantNumeric' as const
    static override matches = '^f(?:ont)?:(?:ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stacked-fractions|$values)(?!\\|)'
}