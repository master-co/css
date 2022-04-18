import { ANIMATION, DASH, DIRECTION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationDirection extends Style {
    static override matches = /^\@direction:./;
    static override key = ANIMATION + DASH + DIRECTION;
}