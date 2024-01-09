import './style.css'
import { setupCounter } from './counter'
import { initCSSRuntime } from '@master/css-runtime'
import config from '../master.css'

initCSSRuntime(config)

const counterElement = document.querySelector<HTMLButtonElement>('#counter')
counterElement?.classList.add('~transform|.3s', 'translateY(-5):hover')

setupCounter(counterElement!)
