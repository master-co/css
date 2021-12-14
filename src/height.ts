import { FIT, FIT_CONTENT, FULL, HEIGHT, H_PREFIX, MAX, MAX_CONTENT, MIN, MIN_CONTENT, PERCENT100 } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class HeightStyle extends MasterStyle {
    static override prefixes = /^h:/;
    static override properties = [HEIGHT];
    static override semantics = {
        [H_PREFIX + FULL]: PERCENT100,
        [H_PREFIX + FIT]: FIT_CONTENT,
        [H_PREFIX + MAX]: MAX_CONTENT,
        [H_PREFIX + MIN]: MIN_CONTENT
    }
}