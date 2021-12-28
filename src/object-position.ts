import { DASH, OBJECT, POSITION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class ObjectPositionStyle extends Style {
    static override matches =  /^object:(top|bottom|right|left|center)$/;
    static override key = OBJECT + DASH + POSITION;
}