import { dash, DECORATION, LINE, TEXT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TextDecorationLine'
    static override matches = /^t(ext)?:(none|underline|overline|line-through)(?!\|)/;
    static override propName = dash(TEXT, DECORATION, LINE);
}