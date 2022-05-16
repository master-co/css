import { ANIMATION, COUNT, dash, ITERATION } from '../constants/css-property-keyword';
import { Style } from '../style';

export class AnimationIterationCount extends Style {
    static override matches = /^\@iteration-count:./;
    static override key = dash(ANIMATION, ITERATION, COUNT);
    static override unit = '';
}