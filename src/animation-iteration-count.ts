import { ANIMATION, COUNT, DASH, ITERATION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationIterationCountStyle extends Style {
    static override prefixes = /^\*iteration-count:/;
    static override properties = [ANIMATION + DASH + ITERATION + DASH + COUNT];
}