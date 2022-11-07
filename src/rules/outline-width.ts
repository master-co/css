import Rule from '../rule'

export default class extends Rule {
    static override id = 'OutlineWidth'
    static override matches = /^outline:(medium|thick|thin|[0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$/
}