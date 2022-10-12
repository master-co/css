import { dash, DECORATION, TEXT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TextDecoration'
    static override matches = /^t(ext)?:(underline|line-through|overline)/;
    static override propName = dash(TEXT, DECORATION);
    static override colorful = true;
    override order = -1;
}