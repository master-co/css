import { Config, extendConfig } from '@master/css'
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
