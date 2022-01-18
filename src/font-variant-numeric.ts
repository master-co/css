import { DASH, FONT, NUMERIC, VARIANT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FontVariantNumericStyle extends Style {
    static override matches = /^f(ont)?:(ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stacked-fractions)(?!;)/;
    static override key = FONT + DASH + VARIANT + DASH + NUMERIC;
}