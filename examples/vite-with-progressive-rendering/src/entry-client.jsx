import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'

import MasterCSS from '@master/css'
import config from '../master.css.js'
new MasterCSS(config)

ReactDOM.hydrateRoot(
  document.getElementById('app'),
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
console.log('hydrated')
