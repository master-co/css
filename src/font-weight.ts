import { DASH, FONT, WEIGHT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FontWeightStyle extends Style {
    static override matches = /^f-weight:|f(ont)?:(thin|extralight|light|regular|medium|semibold|bold|extrabold|heavy)/;
    static override key = FONT + DASH + WEIGHT;
    static override unit = '';
    static override values = {
        thin: 100,
        extralight: 200,
        light: 300,
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        heavy: 900
    };
}