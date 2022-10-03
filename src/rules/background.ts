import { MasterCSSRule } from '../rule';
import { BACKGROUND } from '../constants/css-property-keyword';

export class Background extends MasterCSSRule {
    static override matches = /^bg:./;
    static override key = BACKGROUND;
    static override colorful = true;
    override order = -1;
}