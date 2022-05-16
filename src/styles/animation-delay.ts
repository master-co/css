import { ANIMATION, dash, DELAY } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationDelay extends Style {
    static override matches = /^\@delay:./;
    static override key = dash(ANIMATION, DELAY);
    static override unit = 'ms';
}