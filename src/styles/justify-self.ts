import { dash, JUSTIFY, SELF } from '../constants/css-property-keyword';
import { Style } from '../style';

export class JustifySelf extends Style {
    static override matches =  /^js:./;
    static override key = dash(JUSTIFY, SELF);
}