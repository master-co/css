import { dash, FLEX, GROW } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'FlexGrow'
    static override propName = dash(FLEX, GROW);
    static override unit = '';
}