import { COLOR } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Color extends MasterCSSRule {
    static override colorStarts = '(?:color|fg|foreground):';
    static override colorful = true;
    static override key = COLOR;
    static override unit = '';
}