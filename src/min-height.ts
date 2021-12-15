import { DASH, FIT, FIT_CONTENT, FULL, H_PREFIX, MAX, MAX_CONTENT, MIN, MIN_CONTENT, MIN_HEIGHT, PERCENT100 } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

const MIN_HEIGHT_PREFIX = MIN + DASH + H_PREFIX;

export class MinHeightStyle extends MasterStyle {
    static override prefixes =  /^min-h:/;
    static override properties = [MIN_HEIGHT];
    static override semantics = {
        [MIN_HEIGHT_PREFIX + FULL]: PERCENT100,
        [MIN_HEIGHT_PREFIX + FIT]: FIT_CONTENT,
        [MIN_HEIGHT_PREFIX + MAX]: MAX_CONTENT,
        [MIN_HEIGHT_PREFIX + MIN]: MIN_CONTENT
    }
}