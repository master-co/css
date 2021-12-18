import { ORDER } from './constants/css-property-keyword';
import { Style } from '@master/style';

const extreme = '999999';

export class OrderStyle extends Style {
    static override prefixes = /^o(rder)?:/;
    static override key = ORDER;
    static override values = {
        first: '-' + extreme,
        last: extreme
    }
    static override unit = '';
}