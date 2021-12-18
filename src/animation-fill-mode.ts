import { ANIMATION, DASH, FILL, MODE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationFillModeStyle extends Style {
    static override prefixes = /^\*fill-mode:/;
    static override property = ANIMATION + DASH + FILL + DASH + MODE;
}