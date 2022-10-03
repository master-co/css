import { MasterCSSRule } from '../rule';
import { CARET, COLOR, dash } from '../constants/css-property-keyword';

export class CaretColor extends MasterCSSRule {
    static override key = dash(CARET, COLOR);
    static override colorStarts = 'caret:';
    static override colorful = true;
}