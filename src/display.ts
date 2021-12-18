import { BLOCK, DASH, DISPLAY, FLEX, GRID, INLINE, TABLE, GROUP, COL, COLUMN, CONTENTS, HIDDEN, NONE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class DisplayStyle extends Style {
    static override prefixes = /^d:/;
    static override property = DISPLAY;
    static override semantics = {
        'hidden': NONE
    }
}

for (const value of [
    BLOCK,
    FLEX,
    GRID,
    TABLE,
    CONTENTS,
    INLINE + DASH + BLOCK,
    INLINE + DASH + FLEX,
    INLINE + DASH + GRID,
    INLINE + DASH + TABLE
]) {
    DisplayStyle.semantics[value] = value
}