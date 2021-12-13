import { ANIMATION, COUNT, DASH, ITERATION } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class AnimationIterationCountStyle extends MasterStyle {
    static override prefixes = /^(animation-iteration-count|\*iteration-count):/;
    static override properties = [ANIMATION + DASH + ITERATION + DASH + COUNT];
}