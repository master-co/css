import { COLOR, DASH, DECORATION, TEXT } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TextDecorationColorStyle extends MasterStyle {
    static override prefixes =  /^t(ext)?-decoration-color:/;
    static override properties = [TEXT + DASH + DECORATION + DASH + COLOR];
    static override supportFullName = false;
}