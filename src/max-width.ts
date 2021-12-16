import { FIT, FIT_CONTENT, FULL, MAX, MAX_CONTENT, MAX_WIDTH, MIN, MIN_CONTENT, PERCENT100, W_PREFIX } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class MaxWidthStyle extends Style {
    static override prefixes =  /^max-w(idth)?:/;
    static override properties = [MAX_WIDTH];
    static override supportFullName = false;
    static override values = {
        [FULL]: PERCENT100,
        [FIT]: FIT_CONTENT,
        [MAX]: MAX_CONTENT,
        [MIN]: MIN_CONTENT
    }
}