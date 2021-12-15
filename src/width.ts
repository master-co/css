import { FIT, FIT_CONTENT, FULL, MAX, MAX_CONTENT, MIN, MIN_CONTENT, PERCENT100, WIDTH, W_PREFIX } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class WidthStyle extends MasterStyle {
    static override prefixes =  /^w:/;
    static override properties = [WIDTH];
    static override semantics = {
        [W_PREFIX + FULL]: PERCENT100,
        [W_PREFIX + FIT]: FIT_CONTENT,
        [W_PREFIX + MAX]: MAX_CONTENT,
        [W_PREFIX + MIN]: MIN_CONTENT
    }
}