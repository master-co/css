import { CONTENT, DASH, PLACE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class PlaceContentStyle extends MasterStyle {
    static override prefixes = /^place-content:/;
    static override properties = [PLACE + DASH + CONTENT];
}