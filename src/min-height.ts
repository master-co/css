import { DASH, FIT, FIT_CONTENT, FULL, H_PREFIX, MAX, MAX_CONTENT, MIN, MIN_CONTENT, MIN_HEIGHT, PERCENT100 } from './constants/css-property-keyword';
import { Style } from '@master/style';

const MIN_HEIGHT_PREFIX = MIN + DASH + H_PREFIX;

export class MinHeightStyle extends Style {
    static override prefixes =  /^min-h(eight)?:/;
    static override properties = [MIN_HEIGHT];
    static override supportFullName = false;
    static override values = {
        [FULL]: PERCENT100,
        [FIT]: FIT_CONTENT,
        [MAX]: MAX_CONTENT,
        [MIN]: MIN_CONTENT
    }
}