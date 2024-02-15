import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { CSSRuntimeProvider } from '@master/css.react'
import config from '../master.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <CSSRuntimeProvider config={config}>
            <App />
        </CSSRuntimeProvider>
    </React.StrictMode>,
)
