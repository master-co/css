import './style.css'
import { setupCounter } from './counter'
import { initRuntime } from '@master/css'
import config from '../master.css'

initRuntime(config)

const counterElement = document.querySelector<HTMLButtonElement>('#counter')
counterElement?.classList.add('~transform|.3s', 'translateY(-5):hover')

setupCounter(counterElement!)
