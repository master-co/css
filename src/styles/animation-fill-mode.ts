import { ANIMATION, dash, FILL, MODE } from '../constants/css-property-keyword';
import { Style } from '../style';

export class AnimationFillMode extends Style {
    static override matches = /^\@fill-mode:./;
    static override key = dash(ANIMATION, FILL, MODE);
}