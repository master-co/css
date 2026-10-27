import { withMasterCSS } from '../../dist/index.js'

/** @type {import('next').NextConfig} */
export default withMasterCSS({ output: 'export' }, { mode: 'static' })
