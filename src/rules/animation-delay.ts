import { ANIMATION, dash, DELAY } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'AnimationDelay'
    static override matches = /^\@delay:./;
    static override propName = dash(ANIMATION, DELAY);
    static override unit = 'ms';
}