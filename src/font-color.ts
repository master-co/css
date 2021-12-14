import { COLOR } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class FontColorStyle extends MasterStyle {
    static override prefixes =  /^(f-)?color:/;
    static override properties = [COLOR];
}