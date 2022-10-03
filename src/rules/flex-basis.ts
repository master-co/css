import { BASIS, dash, FLEX, SIZING_VALUES } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class FlexBasis extends MasterCSSRule {
    static override key = dash(FLEX, BASIS);
    static override values = SIZING_VALUES;
}