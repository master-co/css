import { ALIGN, CONTENT, DASH } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AlignContent extends Style {
    static override key = ALIGN + DASH + CONTENT;
}