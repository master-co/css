import { Style } from '@master/style';
import { ACCENT, COLOR, DASH } from './constants/css-property-keyword';

export class AccentColorStyle extends Style {
    static override property = ACCENT + DASH + COLOR;
}