import { type Config, extendConfig } from '@master/css'
import preset from './preset.css'

export default extendConfig(preset, {
    utilities: [
        {
            name: 'bundle-button',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { display: 'inline-flex' } },
                { selector: '&', declarations: { color: 'oklch(100% 0 none)' } },
                { selector: '&', declarations: { 'background-color': 'oklch(63.7% 0.237 25.331)' } }
            ]
        }
    ]
}) as Config
