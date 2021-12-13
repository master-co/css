import { MasterStyle } from '@master/style';
import { DASH, SHADOW, TEXT } from './constants/css-property-keyword';

export class TextShadowStyle extends MasterStyle {
    static override prefixes = /^t-shadow:/;
    static override properties = [TEXT + DASH + SHADOW];
}