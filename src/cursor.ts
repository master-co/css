import { MasterStyle } from '@master/style';
import { CURSOR } from './constants/css-property-keyword';

export class MasterCursorStyle extends MasterStyle {
    static override prefixes = /^cursor:/;
    static override properties = [CURSOR];
}