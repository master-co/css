import Rule from '../rule'

export default class extends Rule {
    static override id: 'FontWeight' = 'FontWeight' as const
    static override matches = /^f(ont)?:(thin|extralight|light|regular|medium|semibold|bold|bolder|extrabold|heavy)(?!\|)/
    static override unit = ''
}