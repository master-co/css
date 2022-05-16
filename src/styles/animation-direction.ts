import { ANIMATION, dash, DIRECTION } from '../constants/css-property-keyword';
import { Style } from '../style';

export class AnimationDirection extends Style {
    static override matches = /^\@direction:./;
    static override key = dash(ANIMATION, DIRECTION);
}