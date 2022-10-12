import { COLOR } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Color'
    static override colorStarts = '(?:color|fg|foreground):';
    static override colorful = true;
    static override propName = COLOR;
    static override unit = '';
}