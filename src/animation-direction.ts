import { ANIMATION, DASH, DIRECTION } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterAnimationDirectionStyle extends MasterStyle {
    static override prefixes = /^(animation-direction|\*direction):/;
    static override properties = [ANIMATION + DASH + DIRECTION];
}