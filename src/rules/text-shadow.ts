import { MasterCSSRule } from '../rule';
import { dash, SHADOW, TEXT } from '../constants/css-property-keyword';

export class TextShadow extends MasterCSSRule {
    static override key = dash(TEXT, SHADOW);
    static override colorful = true;
}