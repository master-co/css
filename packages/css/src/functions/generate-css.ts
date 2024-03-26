import { Config } from '../config'
import MasterCSS from '../core'

export default function generateCSS(classes: string[], cssOrConfig?: MasterCSS | Config) {
    // improve performance
    if (cssOrConfig instanceof MasterCSS) {
        const css = cssOrConfig
        let text = ''
        css.add(...classes)
        text = css.text
        css.delete(...classes)
        return text
    } else {
        return new MasterCSS(cssOrConfig).add(...classes).text
    }
}