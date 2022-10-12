import { dash, DELAY, TRANSITION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TransitionDelay'
    static override matches = /^~delay:./;
    static override propName = dash(TRANSITION, DELAY);
    static override unit = 'ms';
}