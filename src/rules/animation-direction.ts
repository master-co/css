import { ANIMATION, dash, DIRECTION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class AnimationDirection extends MasterCSSRule {
    static override matches = /^\@direction:./;
    static override key = dash(ANIMATION, DIRECTION);
}