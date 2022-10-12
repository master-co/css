import { dash, FLEX, SHRINK } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'FlexShrink'
    static override propName = dash(FLEX, SHRINK);
    static override unit = '';
}