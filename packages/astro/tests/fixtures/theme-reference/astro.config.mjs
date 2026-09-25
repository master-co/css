import { defineConfig } from 'astro/config'
import masterCSS from '../../../dist/index.js'

export default defineConfig({ integrations: [masterCSS({ mode: 'static' })] })
