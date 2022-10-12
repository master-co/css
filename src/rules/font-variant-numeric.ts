import { dash, FONT, NUMERIC, VARIANT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'FontVariantNumeric'
    static override matches = /^f(ont)?:(ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stacked-fractions)(?!\|)/;
    static override propName = dash(FONT, VARIANT, NUMERIC);
}