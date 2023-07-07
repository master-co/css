import './style.css'
import '.virtual/master.css'
import { setupCounter } from './counter'

const counterElement = document.querySelector<HTMLButtonElement>('#counter')
counterElement?.classList.add('~transform|.3s', 'translateY(-5):hover')

setupCounter(counterElement!)