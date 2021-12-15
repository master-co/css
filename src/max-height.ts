import { DASH, FIT, FIT_CONTENT, FULL, H_PREFIX, MAX, MAX_CONTENT, MAX_HEIGHT, MIN, MIN_CONTENT, PERCENT100 } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

const MAX_HEIGHT_PREFIX = MAX + DASH + H_PREFIX;

export class MaxHeightStyle extends MasterStyle {
    static override prefixes = /^max-h:/;
    static override properties = [MAX_HEIGHT];
    static override semantics = {
        [MAX_HEIGHT_PREFIX + FULL]: PERCENT100,
        [MAX_HEIGHT_PREFIX + FIT]: FIT_CONTENT,
        [MAX_HEIGHT_PREFIX + MAX]: MAX_CONTENT,
        [MAX_HEIGHT_PREFIX + MIN]: MIN_CONTENT
    }
}