import Rule from '../rule'

export default class extends Rule {
    static override id = 'FontSize'
    static override matches = /^f(ont)?:([0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$/
}