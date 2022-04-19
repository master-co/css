import { dash, OBJECT, POSITION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class ObjectPosition extends Style {
    static override matches = /^(object|obj):(top|bottom|right|left|center)/;
    static override key = dash(OBJECT, POSITION);
}