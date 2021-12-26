import { DASH, FONT, NUMERIC, VARIANT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FontVariantNumericStyle extends Style {
    static override matches = /^(f-variant-numeric:.|f(ont)?:(ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stached-fractions))/;
    static override key = FONT + DASH + VARIANT + DASH + NUMERIC;
}