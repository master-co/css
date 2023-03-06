import { RuleConfig } from '../rule'

export const fontVariantNumeric: RuleConfig = {
    matches: '^f(?:ont)?:(?:ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stacked-fractions|$values)(?!\\|)'
}