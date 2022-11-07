import Rule from '../rule'

export default class extends Rule {
    static override id = 'ShapeOutside'
    static override matches = /^shape:((margin|content|border|padding)(?!\|)|(inset|circle|ellipse|polygon|url|linear-gradient)\(.*\)((?!\|).)*$)/
}