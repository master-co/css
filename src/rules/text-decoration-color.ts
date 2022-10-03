import { COLOR, dash, DECORATION, TEXT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TextDecorationColor extends MasterCSSRule {
    static override key = dash(TEXT, DECORATION, COLOR);
    static override colorStarts = 'text-decoration:';
    static override colorful = true;
}