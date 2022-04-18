import { ANIMATION, DASH, FILL, MODE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationFillMode extends Style {
    static override matches = /^\@fill-mode:./;
    static override key = ANIMATION + DASH + FILL + DASH + MODE;
}