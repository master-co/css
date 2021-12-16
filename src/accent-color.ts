import { MasterStyle } from '@master/style';
import { ACCENT, COLOR, DASH } from './constants/css-property-keyword';

export class AccentColorStyle extends MasterStyle {
    static override properties = [ACCENT + DASH + COLOR];
}