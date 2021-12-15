import { DASH, FIT, FIT_CONTENT, FULL, MAX, MAX_CONTENT, MAX_WIDTH, MIN, MIN_CONTENT, PERCENT100, W_PREFIX } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

const MAX_W_PREFIX = MAX + DASH + W_PREFIX;

export class MaxWidthStyle extends MasterStyle {
    static override prefixes =  /^max-w:/;
    static override properties = [MAX_WIDTH];
    static override semantics = {
        [MAX_W_PREFIX + FULL]: PERCENT100,
        [MAX_W_PREFIX + FIT]: FIT_CONTENT,
        [MAX_W_PREFIX + MAX]: MAX_CONTENT,
        [MAX_W_PREFIX + MIN]: MIN_CONTENT
    }
}