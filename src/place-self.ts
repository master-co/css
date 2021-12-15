import { DASH, PLACE, SELF } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class PlaceSelfStyle extends MasterStyle {
    static override prefixes = /^place-self:/;
    static override properties = [PLACE + DASH + SELF];
}