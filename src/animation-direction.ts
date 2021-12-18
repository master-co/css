import { ANIMATION, DASH, DIRECTION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationDirectionStyle extends Style {
    static override prefixes = /^\*direction:/;
    static override property = ANIMATION + DASH + DIRECTION;
}