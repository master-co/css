import { BREAK, DASH, OVERFLOW, SPACING, WORD, WRAP } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

const BREAK_WORD = BREAK + DASH + WORD;
const OVERFLOW_WRAP = OVERFLOW + DASH + WRAP;
export class WordSpacingStyle extends MasterStyle {
    static override prefixes = /^ws:/;
    static override properties = [WORD + DASH + SPACING];
}