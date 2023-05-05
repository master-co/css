import { renderIntoHTML } from '@master/css'
import config from '../../master.css.js'

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('render:response', (response) => {
        response.body = renderIntoHTML(response.body, config)
    })
})