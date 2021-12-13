import { ANIMATION, DASH, FILL, MODE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class AnimationFillModeStyle extends MasterStyle {
    static override prefixes = /^(animation-fill-mode|\*fill-mode):/;
    static override properties = [ANIMATION + DASH + FILL + DASH + MODE];
}