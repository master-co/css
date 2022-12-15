import './style.css'
import 'master.css'
import { setupCounter } from './counter'

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
