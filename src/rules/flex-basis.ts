import { BASIS, dash, FLEX } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'FlexBasis'
    static override propName = dash(FLEX, BASIS);
}