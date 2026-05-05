import { Config } from '@master/css'
import card from './styles/card.css'

export default {
    extends: [
        card
    ],
    components: {
        btn: ['inline-flex', 'text:center']
    },
    variables: [
        { key: 'foo', value: 123 },
        { key: 'global', value: '#ff00ff' }
    ]
} as Config
