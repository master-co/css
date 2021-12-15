import { ANIMATION, DASH, DIRECTION } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class AnimationDirectionStyle extends MasterStyle {
    static override prefixes = /^\*direction:/;
    static override properties = [ANIMATION + DASH + DIRECTION];
}