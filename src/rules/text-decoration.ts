import { dash, DECORATION, TEXT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TextDecoration extends MasterCSSRule {
    static override matches = /^t(ext)?:(underline|line-through|overline)/;
    static override key = dash(TEXT, DECORATION);
    static override colorful = true;
    override order = -1;
}