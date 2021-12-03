import { DASH, FONT, NUMERIC, VARIANT } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterFontVariantNumericVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(f-variant-numeric:|f:(ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stached-fractions))/;
    static override properties = [FONT + DASH + VARIANT + DASH + NUMERIC];
}