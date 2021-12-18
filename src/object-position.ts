import { DASH, OBJECT, POSITION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class ObjectPositionStyle extends Style {
    static override prefixes =  /^object:(top|bottom|right|left|center)/;
    static override property = OBJECT + DASH + POSITION;
}