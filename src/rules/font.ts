import { FONT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Font extends MasterCSSRule {
    static override matches = /^f:./;
    static override key = FONT;
    static override unit = '';
    override order = -1;
}