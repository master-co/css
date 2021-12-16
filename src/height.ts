import { FIT, FIT_CONTENT, FULL, HEIGHT, H_PREFIX, MAX, MAX_CONTENT, MIN, MIN_CONTENT, PERCENT100 } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class HeightStyle extends Style {
    static override prefixes = /^h:/;
    static override properties = [HEIGHT];
    static override values = {
        [FULL]: PERCENT100,
        [FIT]: FIT_CONTENT,
        [MAX]: MAX_CONTENT,
        [MIN]: MIN_CONTENT
    }
}