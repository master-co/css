import { ORDER } from '../constants/css-property-keyword';
import { Style } from '@master/style';

const extreme = '999999';

export class Order extends Style {
    static override matches = /^o:./;
    static override key = ORDER;
    static override values = {
        first: '-' + extreme,
        last: extreme
    }
    static override unit = '';
}