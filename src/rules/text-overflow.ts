import { dash, OVERFLOW, TEXT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TextOverflow extends MasterCSSRule {
    static override matches = /^(text-(overflow|ovf):.|t(ext)?:(ellipsis|clip)(?!\|))/;
    static override propName = dash(TEXT, OVERFLOW);
}