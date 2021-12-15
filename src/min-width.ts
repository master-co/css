import { DASH, FIT, FIT_CONTENT, FULL, MAX, MAX_CONTENT, MIN, MIN_CONTENT, MIN_WIDTH, PERCENT100, W_PREFIX } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

const MIN_W_PREFIX = MIN + DASH + W_PREFIX;

export class MinWidthStyle extends MasterStyle {
    static override prefixes =  /^min-w:/;
    static override properties = [MIN_WIDTH];
    static override semantics = {
        [MIN_W_PREFIX + FULL]: PERCENT100,
        [MIN_W_PREFIX + FIT]: FIT_CONTENT,
        [MIN_W_PREFIX + MAX]: MAX_CONTENT,
        [MIN_W_PREFIX + MIN]: MIN_CONTENT
    }
}