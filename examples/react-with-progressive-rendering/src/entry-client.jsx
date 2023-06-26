import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { CSSProvider } from '@master/css.react'

ReactDOM.hydrateRoot(
    document.getElementById('app'),
    <CSSProvider config={import('../master.css')}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </CSSProvider>,
)
