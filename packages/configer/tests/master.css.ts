import { Config } from '@master/css'
import { extendConfig } from '@master/css/utils'
import card from './card.css'

export default extendConfig(card, {
    utilities: [
        {
            name: 'btn',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { display: 'inline-flex' } }
            ]
        }
    ]
}) as Config
