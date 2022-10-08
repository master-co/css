import { ANIMATION, COUNT, dash, ITERATION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class AnimationIterationCount extends MasterCSSRule {
    static override matches = /^\@iteration-count:./;
    static override propName = dash(ANIMATION, ITERATION, COUNT);
    static override unit = '';
}