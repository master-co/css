import { ORDER } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

const extreme = '999999';

export class Order extends MasterCSSRule {
    static override matches = /^o:./;
    static override key = ORDER;
    static override unit = '';
}