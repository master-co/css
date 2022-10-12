import { FLEX } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Flex'
    static override propName = FLEX;
    static override unit = '';
    override order = -1;
}