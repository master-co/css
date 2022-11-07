import Rule from '../rule'

export default class extends Rule {
    static override id = 'TextAlign'
    static override matches = /^t(ext)?:(justify|center|left|right|start|end)(?!\|)/
}