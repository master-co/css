import { OUTLINE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Outline'
    static override propName = OUTLINE;
    override order = -1;
    static override colorful = true;
}