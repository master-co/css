import { ORDER } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

const extreme = '999999';

export default class extends MasterCSSRule {
    static override id = 'Order'
    static override matches = /^o:./;
    static override propName = ORDER;
    static override unit = '';
}