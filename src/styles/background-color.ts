import { Style } from '../style';
import { BACKGROUND, COLOR, CURRENT_COLOR, dash } from '../constants/css-property-keyword';

export class BackgroundColor extends Style {
    static override matches = /^(bg|background):(?:transparent|current)(?!\|)/;
    static override colorStarts = '(bg|background):';
    static override key = dash(BACKGROUND, COLOR);
    static override unit = '';
    static override colorful = true;
    static override values = {
        current: CURRENT_COLOR
    }
}