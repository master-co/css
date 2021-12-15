import { DASH, OBJECT, POSITION } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class ObjectPositionStyle extends MasterStyle {
    static override prefixes =  /^object:(top|bottom|right|left|center)/;
    static override properties = [OBJECT + DASH + POSITION];
}