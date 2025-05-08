// @ts-expect-error es
import { createApp, watch } from 'petite-vue'
import post from './utils/post'
import { states } from './ui-common'
// import { watch } from '@vue/reactivity'
import './ui-bridge'
import './ui.scss'

createApp(states).mount()

post('get-variable-collections')