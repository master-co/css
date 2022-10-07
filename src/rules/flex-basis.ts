import { BASIS, dash, FLEX } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class FlexBasis extends MasterCSSRule {
    static override key = dash(FLEX, BASIS);
}