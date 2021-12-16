import { FIT, FIT_CONTENT, FULL, MAX, MAX_CONTENT, MAX_HEIGHT, MIN, MIN_CONTENT, PERCENT100 } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class MaxHeightStyle extends Style {
    static override prefixes = /^max-h(eight)?:/;
    static override properties = [MAX_HEIGHT];
    static override supportFullName = false;
    static override values = {
        [FULL]: PERCENT100,
        [FIT]: FIT_CONTENT,
        [MAX]: MAX_CONTENT,
        [MIN]: MIN_CONTENT
    }
}