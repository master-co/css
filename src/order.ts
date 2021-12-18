import { FIRST, LAST, ORDER, ORDER_PREFIX } from './constants/css-property-keyword';
import { Style } from '@master/style';

const extreme = '999999';

export class OrderStyle extends Style {
    static override prefixes = /^o:/;
    static override property = ORDER;
    static override semantics = {
        [ORDER + ':' + FIRST]: '-' + extreme,
        [ORDER_PREFIX + FIRST]: '-' + extreme,
        [ORDER + ':' + LAST]: extreme,
        [ORDER_PREFIX + LAST]: extreme
    }
    static override unit = '';
}