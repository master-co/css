import { OUTLINE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Outline extends MasterCSSRule {
    static override key = OUTLINE;
    override order = -1;
    static override colorful = true;
}