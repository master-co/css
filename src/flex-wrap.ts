import { DASH, FLEX, FLEX_PREFIX, NOWRAP, REVERSE, WRAP } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

const WRAP_REVERSE = WRAP + DASH + REVERSE;

export class FlexWrapStyle extends MasterStyle {
    static override prefixes = /^flex-wrap:/;
    static override properties = [FLEX + DASH + WRAP];
    static override semantics = {
        [FLEX_PREFIX + WRAP]: WRAP,
        [FLEX_PREFIX + WRAP_REVERSE]: WRAP_REVERSE,
        [FLEX_PREFIX + NOWRAP]: NOWRAP
    }
}