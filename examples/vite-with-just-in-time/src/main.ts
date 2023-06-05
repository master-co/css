import './style.css'
import { setupCounter } from './counter'

const counterElement = document.querySelector<HTMLButtonElement>('#counter')
counterElement?.classList.add('~transform|.3s', 'translateY(-5):hover')

setupCounter(counterElement!)

import MasterCSS from '@master/css'
import config from '../master.css.mjs'
new MasterCSS(config)
