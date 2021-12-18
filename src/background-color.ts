import { Style } from '@master/style';
import { BACKGROUND, COLOR, DASH } from './constants/css-property-keyword';

export class BackgroundColorStyle extends Style {
    static override prefixes = /^((bg|background)-color:|(bg|background):transparent)/;
    static override property = BACKGROUND + DASH + COLOR;
    static override supportFullName = false;
}