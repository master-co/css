import { ANIMATION, dash, DURATION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'AnimationDuration'
    static override matches = /^\@duration:./;
    static override propName = dash(ANIMATION, DURATION);
    static override unit = 'ms';
}