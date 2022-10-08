import { ORDER } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

const extreme = '999999';

export class Order extends MasterCSSRule {
    static override matches = /^o:./;
    static override propName = ORDER;
    static override unit = '';
}