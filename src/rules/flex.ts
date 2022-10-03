import { FLEX } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Flex extends MasterCSSRule {
    static override key = FLEX;
    static override unit = '';
    override order = -1;
}