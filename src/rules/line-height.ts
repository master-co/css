import { dash, HEIGHT, LINE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'LineHeight'
    static override matches = /^lh:./;
    static override propName = dash(LINE, HEIGHT);
    static override unit = '';
}