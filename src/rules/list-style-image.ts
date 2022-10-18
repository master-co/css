import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'ListStyleImage'
    static override matches = /^list-style:(url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\(.*\)((?!\|).)*$/
    static override propName = 'list-style-image'
}