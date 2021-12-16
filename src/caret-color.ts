import { MasterStyle } from '@master/style';
import { CARET, COLOR, DASH } from './constants/css-property-keyword';

export class CaretColorStyle extends MasterStyle {
    static override properties = [CARET + DASH + COLOR];
}