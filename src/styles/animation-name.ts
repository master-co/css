import { ANIMATION, dash, NAME } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationName extends Style {
    static override matches = /^\@name:./;
    static override key = dash(ANIMATION, NAME);
}