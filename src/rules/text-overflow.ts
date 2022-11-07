import Rule from '../rule'

export default class extends Rule {
    static override id = 'TextOverflow'
    static override matches = /^(text-(overflow|ovf):.|t(ext)?:(ellipsis|clip)(?!\|))/
}