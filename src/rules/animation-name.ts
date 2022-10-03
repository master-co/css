import { ANIMATION, dash, NAME } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class AnimationName extends MasterCSSRule {
    static override matches = /^\@name:./;
    static override key = dash(ANIMATION, NAME);
}