import { DASH, FIT, FIT_CONTENT, FULL, MAX, MAX_CONTENT, MIN, MIN_CONTENT, MIN_WIDTH, PERCENT100, W_PREFIX } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

const MIN_W_PREFIX = MIN + DASH + W_PREFIX;

export class MinWidthStyle extends MasterStyle {
    static override prefixes =  /^min-w(idth)?:/;
    static override properties = [MIN_WIDTH];
    static override supportFullName = false;
    static override values = {
        [FULL]: PERCENT100,
        [FIT]: FIT_CONTENT,
        [MAX]: MAX_CONTENT,
        [MIN]: MIN_CONTENT
    }
}