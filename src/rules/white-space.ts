import { BREAK, dash, SPACE, WHITE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'WhiteSpace'
    static override propName = dash(WHITE, SPACE);
    static override unit = '';
}