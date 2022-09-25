import { Style } from '../style';
import { BACKGROUND, COLOR, dash } from '../constants/css-property-keyword';

export class BackgroundColor extends Style {
    static override colorStarts = '(bg|background):';
    static override key = dash(BACKGROUND, COLOR);
    static override unit = '';
    static override colorful = true;
}