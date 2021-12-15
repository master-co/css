import { BLOCK, CAPTION, DASH, DISPLAY, FLEX, GRID, INLINE, TABLE, CELL, GROUP, FOOTER, HEADER, ROW, FLOW, ROOT, ITEM, LIST, COL, COLUMN } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class DisplayStyle extends MasterStyle {
    static override prefixes = /^d:/;
    static override properties = [DISPLAY];
    static override semantics = {
        [TABLE + DASH + COL]: TABLE + DASH + COLUMN,
        [TABLE + DASH + COL + DASH + GROUP]: TABLE + DASH + COLUMN + DASH + GROUP,
    }
}

for (const value of [
    INLINE + DASH + BLOCK,
    INLINE + DASH + FLEX,
    INLINE + DASH + GRID,
    INLINE + DASH + TABLE,
    TABLE + DASH + CAPTION,
    TABLE + DASH + CELL,
    TABLE + DASH + FOOTER + DASH + GROUP,
    TABLE + DASH + HEADER + DASH + GROUP,
    TABLE + DASH + ROW + DASH + GROUP,
    TABLE + DASH + ROW,
    FLOW + DASH + ROOT,
    LIST + DASH + ITEM
]) {
    DisplayStyle.semantics[value] = value
}