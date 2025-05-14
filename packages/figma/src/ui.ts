import { createApp } from 'petite-vue'
import post from './utils/post'
import { states } from './ui-common'
import './ui-bridge'
import './ui.scss'

createApp(states).mount()

post('get-variable-collections')