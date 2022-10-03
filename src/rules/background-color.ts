import { MasterCSSRule } from '../rule';
import { BACKGROUND, COLOR, dash } from '../constants/css-property-keyword';

export class BackgroundColor extends MasterCSSRule {
    static override colorStarts = '(bg|background):';
    static override key = dash(BACKGROUND, COLOR);
    static override unit = '';
    static override colorful = true;
}