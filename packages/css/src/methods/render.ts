import { MasterCSS } from '../css'
import type { Config } from '../config'

export function render(classes: string[], config?: Config): string {
    if (!classes?.length) return
    const css = new MasterCSS({ ...config, observe: false })
    for (const eachClassName of classes) {
        if (!(eachClassName in css.countOfClass)) {
            if (css.insert(eachClassName))
                css.countOfClass[eachClassName] = 1
        }
    }
    return css.text
}