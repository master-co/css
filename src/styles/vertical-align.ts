import { ALIGN, dash, VERTICAL } from '../constants/css-property-keyword';
import { Style } from '../style';

export class VerticalAlign extends Style {
    static override matches = /^(?:v|vertical):./;
    static override key = dash(VERTICAL, ALIGN);
}