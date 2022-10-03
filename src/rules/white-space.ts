import { BREAK, dash, SPACE, WHITE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class WhiteSpace extends MasterCSSRule {
    static override key = dash(WHITE, SPACE);
    static override unit = '';
}