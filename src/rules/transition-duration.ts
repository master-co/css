import { dash, DURATION, TRANSITION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TransitionDuration'
    static override matches = /^~duration:./;
    static override propName = dash(TRANSITION, DURATION);
    static override unit = 'ms';
}