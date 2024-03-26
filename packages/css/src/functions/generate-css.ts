import { Config } from '../config'
import MasterCSS from '../core'

export default function generateCSS(classes: string[], config?: Config) {
    return new MasterCSS(config).add(...classes).text
}