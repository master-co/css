import { BREAK, dash, SPACE, WHITE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class WhiteSpace extends MasterCSSRule {
    static override propName = dash(WHITE, SPACE);
    static override unit = '';
}