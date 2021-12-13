import { DASH, TEXT, TRANSFORM } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TextTransformStyle extends MasterStyle {
    static override prefixes = /^(t-transform:|t:(uppercase|lowercase|capitalize))/;
    static override properties = [TEXT + DASH + TRANSFORM];
}