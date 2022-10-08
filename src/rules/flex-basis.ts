import { BASIS, dash, FLEX } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class FlexBasis extends MasterCSSRule {
    static override propName = dash(FLEX, BASIS);
}