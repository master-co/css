import { dash, HEIGHT, LINE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class LineHeight extends MasterCSSRule {
    static override matches = /^lh:./;
    static override propName = dash(LINE, HEIGHT);
    static override unit = '';
}