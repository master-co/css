import { MasterStyle } from '@master/style';
import { BACKGROUND, DASH, IMAGE } from './constants/css-property-keyword';

export class MasterBackgroundImageStyle extends MasterStyle {
    static override prefixes =  /^bg-image:/;
    static override properties = [BACKGROUND + DASH + IMAGE];
}