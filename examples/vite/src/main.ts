import './style.css'
import { setupCounter } from './counter'
// import plan from 'virtual:master-css-plan'

// console.log('plan', plan)

const counterElement = document.querySelector<HTMLButtonElement>('#counter')
counterElement?.classList.add('transition:transform|.3s', 'scale(1.1):hover')
counterElement && setupCounter(counterElement)
