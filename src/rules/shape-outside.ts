import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'ShapeOutside'
    static override matches = /^shape:((margin|content|border|padding)(?!\|)|(inset|circle|ellipse|polygon|url|linear-gradient)\(.*\)((?!\|).)*$)/
    static override propName = 'shape-outside'
}