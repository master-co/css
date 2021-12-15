import { FIRST, LAST, ORDER, ORDER_PREFIX } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

const extreme = '999999';

export class OrderStyle extends MasterStyle {
    static override prefixes = /^o:/;
    static override properties = [ORDER];
    static override semantics = {
        [ORDER + ':' + FIRST]: '-' + extreme,
        [ORDER_PREFIX + FIRST]: '-' + extreme,
        [ORDER + ':' + LAST]: extreme,
        [ORDER_PREFIX + LAST]: extreme
    }
    static override defaultUnit = '';
}