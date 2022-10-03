import { dash, FLEX, GROW } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class FlexGrow extends MasterCSSRule {
    static override key = dash(FLEX, GROW);
    static override unit = '';
}