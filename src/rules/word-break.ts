import { BREAK, dash, WORD } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'WordBreak'
    static override propName = dash(WORD, BREAK);
    static override unit = '';
}