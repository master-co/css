import { dash, FLEX, SHRINK } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class FlexShrink extends MasterCSSRule {
    static override key = dash(FLEX, SHRINK);
    static override unit = '';
}