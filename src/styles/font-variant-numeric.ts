import { dash, FONT, NUMERIC, VARIANT } from '../constants/css-property-keyword';
import { Style } from '../style';

export class FontVariantNumeric extends Style {
    static override matches = /^f(ont)?:(ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stacked-fractions)(?!;)/;
    static override key = dash(FONT, VARIANT, NUMERIC);
}