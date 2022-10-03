import { MasterCSSRule } from '../rule';
import { ACCENT, COLOR, dash } from '../constants/css-property-keyword';

export class AccentColor extends MasterCSSRule {
    static override key = dash(ACCENT, COLOR);
    static override colorStarts = 'accent:';
    static override colorful = true;
}