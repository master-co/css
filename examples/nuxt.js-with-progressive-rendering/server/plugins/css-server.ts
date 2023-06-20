import { createCSSServerPlugin } from '@master/css-server.nitro'
// @ts-expect-error allowImportingTsExtensions
import config from '../../master.css.ts'

export default createCSSServerPlugin({ config })