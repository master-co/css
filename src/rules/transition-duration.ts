import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TransitionDuration'
    static override matches = /^~duration:./;
    static override propName = 'transition-duration'
    static override unit = 'ms';
}