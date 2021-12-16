import { ANIMATION, DASH, NAME } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationNameStyle extends Style {
    static override prefixes = /^\*name:/;
    static override properties = [ANIMATION + DASH + NAME];
}