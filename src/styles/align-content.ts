import { ALIGN, CONTENT, dash } from '../constants/css-property-keyword';
import { Style } from '../style';

export class AlignContent extends Style {
    static override matches =  /^ac:./;
    static override key = dash(ALIGN, CONTENT);
}