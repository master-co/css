import { MasterCSSRule } from '../rule';
import { BACKGROUND, COLOR, dash } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BackgroundColor'
    static override colorStarts = '(bg|background):';
    static override propName = dash(BACKGROUND, COLOR);
    static override unit = '';
    static override colorful = true;
}