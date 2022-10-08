import { BLOCK, dash, DISPLAY, FLEX, GRID, INLINE, TABLE, CONTENTS, NONE, FLOW, LIST, ITEM, ROW, COLUMN, GROUP } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Display extends MasterCSSRule {
    static override matches = /^d:./;
    static override propName = DISPLAY;
}