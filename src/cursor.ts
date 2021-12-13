import { MasterStyle } from '@master/style';
import { CURSOR } from './constants/css-property-keyword';

export class CursorStyle extends MasterStyle {
    static override prefixes = /^cursor:/;
    static override properties = [CURSOR];
}