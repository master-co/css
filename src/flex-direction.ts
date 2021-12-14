import { COL, COLUMN, DASH, DIRECTION, FLEX, FLEX_PREFIX, REVERSE, ROW } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

const ROW_REVERSE = ROW + DASH + REVERSE;

export class FlexDirectionStyle extends MasterStyle {
    static override prefixes = /^flex-direction:/;
    static override properties = [FLEX + DASH + DIRECTION];
    static override semantics = {
        [FLEX_PREFIX + ROW]: ROW,
        [FLEX_PREFIX + ROW_REVERSE]: ROW_REVERSE,
        [FLEX_PREFIX + COL]: COLUMN,
        [FLEX_PREFIX + COL + DASH + REVERSE]: COLUMN + DASH + REVERSE,
    }
}