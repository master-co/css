import { ANIMATION, dash, NAME } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'AnimationName'
    static override matches = /^\@name:./;
    static override propName = dash(ANIMATION, NAME);
}