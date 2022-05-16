import { CONTENT, dash, JUSTIFY } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class JustifyContent extends Style {
    static override matches =  /^jc:./;
    static override key = dash(JUSTIFY, CONTENT);

}