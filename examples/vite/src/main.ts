import './style.css'
import { setupCounter } from './counter'
// import manifest from 'virtual:master-css-manifest'

// console.log('manifest', manifest)

const counterElement = document.querySelector<HTMLButtonElement>('#counter')
counterElement?.classList.add('transition:transform|.3s', 'scale(1.1):hover')
counterElement && setupCounter(counterElement)
