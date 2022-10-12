import { COLOR, dash, OUTLINE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'OutlineColor'
    static override propName = dash(OUTLINE, COLOR);
    static override colorStarts = 'outline:';
    static override colorful = true;
}