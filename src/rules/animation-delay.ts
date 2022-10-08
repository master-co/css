import { ANIMATION, dash, DELAY } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class AnimationDelay extends MasterCSSRule {
    static override matches = /^\@delay:./;
    static override propName = dash(ANIMATION, DELAY);
    static override unit = 'ms';
}