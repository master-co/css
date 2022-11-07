import Rule from '../rule'

export default class extends Rule {
    static override id = 'ListStyleImage'
    static override matches = /^list-style:(url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\(.*\)((?!\|).)*$/
}