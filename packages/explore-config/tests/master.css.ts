import { Config, extendConfig } from '@master/css'
import card from './card.css'

export default extendConfig(card, {
    components: {
        btn: [
            { selector: '&', declarations: { display: 'inline-flex' } }
        ]
    }
}) as Config
