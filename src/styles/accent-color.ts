import { Style } from '../style';
import { ACCENT, COLOR, dash } from '../constants/css-property-keyword';

export class AccentColor extends Style {
    static override key = dash(ACCENT, COLOR);
    static override colorStarts = 'accent:';
    static override colorful = true;
}