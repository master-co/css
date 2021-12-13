import { DASH, DECORATION, TEXT } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TextDecorationStyle extends MasterStyle {
    static override prefixes =  /^(t-decoration:|t:(underline|line-throught))/;
    static override properties = [TEXT + DASH + DECORATION];
}