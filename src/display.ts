import { BLOCK, DASH, DISPLAY, FLEX, GRID, INLINE, TABLE, GROUP, COL, COLUMN, CONTENTS, HIDDEN, NONE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class DisplayStyle extends Style {
    static override prefixes = /^d:/;
    static override properties = [DISPLAY];
    static override semantics = {
        [TABLE + DASH + COL]: TABLE + DASH + COLUMN,
        [TABLE + DASH + COL + DASH + GROUP]: TABLE + DASH + COLUMN + DASH + GROUP,
        [HIDDEN]: NONE
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
    INLINE + DASH + TABLE,
    // TABLE + DASH + CAPTION,
    // TABLE + DASH + CELL,
    // TABLE + DASH + FOOTER + DASH + GROUP,
    // TABLE + DASH + HEADER + DASH + GROUP,
    // TABLE + DASH + ROW + DASH + GROUP,
    // TABLE + DASH + ROW,
    // TABLE + DASH + COLUMN + DASH + GROUP,
    // TABLE + DASH + COLUMN,
    // FLOW + DASH + ROOT,
    // LIST + DASH + ITEM
]) {
    DisplayStyle.semantics[value] = value
}