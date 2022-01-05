import { ANIMATION, DASH, NAME } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationNameStyle extends Style {
    static override matches = /^\@name:./;
    static override key = ANIMATION + DASH + NAME;
}