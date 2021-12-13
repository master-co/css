import { MasterStyle } from '@master/style';
import { BACKGROUND, COLOR, DASH } from './constants/css-property-keyword';

export class BackgroundColorStyle extends MasterStyle {
    static override prefixes = /^(bg-color:|bg:transparent)/;
    static override properties = [BACKGROUND + DASH + COLOR];
}