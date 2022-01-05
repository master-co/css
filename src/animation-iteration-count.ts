import { ANIMATION, COUNT, DASH, ITERATION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationIterationCountStyle extends Style {
    static override matches = /^\@iteration-count:./;
    static override key = ANIMATION + DASH + ITERATION + DASH + COUNT;
}