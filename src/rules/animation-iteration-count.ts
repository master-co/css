import { ANIMATION, COUNT, dash, ITERATION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'AnimationIterationCount'
    static override matches = /^\@iteration-count:./;
    static override propName = dash(ANIMATION, ITERATION, COUNT);
    static override unit = '';
}