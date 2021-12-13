import { DASH, FONT, NUMERIC, VARIANT } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class FontVariantNumericStyle extends MasterStyle {
    static override prefixes = /^(f-variant-numeric:|f:(ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stached-fractions))/;
    static override properties = [FONT + DASH + VARIANT + DASH + NUMERIC];
}