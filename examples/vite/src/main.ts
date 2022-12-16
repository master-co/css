import './style.css'
import 'master.css'
import { setupCounter } from './counter'

const classes = 'fg:red text:center'

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
