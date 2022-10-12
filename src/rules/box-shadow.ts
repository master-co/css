import { MasterCSSRule } from '../rule';
import { BOX, dash, SHADOW } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BoxShadow'
    static override matches = /^s(?:hadow)?:./;
    static override propName = dash(BOX, SHADOW);
    static override colorful = true;
}