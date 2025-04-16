import './style.css'
import { setupCounter } from './counter'
// import config from '#master-css-config'

// console.log('config', config)

const counterElement = document.querySelector<HTMLButtonElement>('#counter')
counterElement?.classList.add('~transform|.3s', 'scale(1.1):hover')
counterElement && setupCounter(counterElement)