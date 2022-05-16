import { ANIMATION, dash, DURATION } from '../constants/css-property-keyword';
import { Style } from '../style';

export class AnimationDuration extends Style {
    static override matches = /^\@duration:./;
    static override key = dash(ANIMATION, DURATION);
    static override unit = 'ms';
}