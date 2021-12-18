import { DASH, FONT, NUMERIC, VARIANT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FontVariantNumericStyle extends Style {
    static override prefixes = /^(f(ont)?-variant-numeric:|f(ont)?:(ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stached-fractions))/;
    static override supportFullName = false;
    static override property = FONT + DASH + VARIANT + DASH + NUMERIC;
}