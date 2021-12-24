import { Style } from '@master/style';
import { ACCENT, COLOR, DASH } from './constants/css-property-keyword';

export class AccentColorStyle extends Style {
    static override key = ACCENT + DASH + COLOR;
    static override colorStarts = 'accent:';
}