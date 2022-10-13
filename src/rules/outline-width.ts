import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'OutlineWidth'
    static override matches = /^outline:(medium|thick|thin|[0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$/;
    static override propName = 'outline-width'
}