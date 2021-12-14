import { BLOCK, CONTENTS, CAPTION, DASH, DISPLAY, FLEX, GRID, INLINE, TABLE, CELL, GROUP, FOOTER, HEADER, ROW, FLOW, ROOT, ITEM, LIST, HIDDEN, COL, COLUMN } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

const INLINE_BLOCK = INLINE + DASH + BLOCK,
    INLINE_FLX = INLINE + DASH + FLEX,
    INLINE_GRID = INLINE + DASH + GRID,
    INLINE_TABLE = INLINE + DASH + TABLE,
    INLINE_CAPTION = TABLE + DASH + CAPTION,
    TABLE_CELL = TABLE + DASH + CELL,
    TABLE_FOOTER_GROUP = TABLE + DASH + FOOTER + DASH + GROUP,
    TABLE_HEADER_GROUP = TABLE + DASH + HEADER + DASH + GROUP,
    TABLE_ROW_GROUP = TABLE + DASH + ROW + DASH + GROUP,
    TABLE_ROW = TABLE + DASH + ROW,
    FLOW_ROOT = FLOW + DASH + ROOT,
    LIST_ITEM = LIST + DASH + ITEM;

export class DisplayStyle extends MasterStyle {
    static override prefixes = /^(display|d):/;
    static override properties = [DISPLAY];
    static override semantics = {
        [BLOCK]: BLOCK,
        [INLINE_BLOCK]: INLINE_BLOCK,
        [INLINE]: INLINE,
        [FLEX]: FLEX,
        [INLINE_FLX]: INLINE_FLX,
        [GRID]: GRID,
        [INLINE_GRID]: INLINE_GRID,
        [CONTENTS]: CONTENTS,
        [TABLE]: TABLE,
        [INLINE_TABLE]: INLINE_TABLE,
        [INLINE_CAPTION]: INLINE_CAPTION,
        [TABLE_CELL]: TABLE_CELL,
        [TABLE + DASH + COL]: TABLE + DASH + COLUMN,
        [TABLE + DASH + COL + DASH + GROUP]: TABLE + DASH + COLUMN + DASH + GROUP,
        [TABLE_FOOTER_GROUP]: TABLE_FOOTER_GROUP,
        [TABLE_HEADER_GROUP]: TABLE_HEADER_GROUP,
        [TABLE_ROW_GROUP]: TABLE_ROW_GROUP,
        [TABLE_ROW]: TABLE_ROW,
        [FLOW_ROOT]: FLOW_ROOT,
        [LIST_ITEM]: LIST_ITEM,
        [HIDDEN]: HIDDEN
    }
}