import './style.css'
import { setupCounter } from './counter'

const counterElement = document.querySelector<HTMLButtonElement>('#counter')
counterElement?.classList.add('~transform|.3s', 'scale(1.1):hover')
counterElement && setupCounter(counterElement)