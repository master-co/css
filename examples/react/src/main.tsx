import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ThemeProvider } from '@master/css.react'
import CSSProvider from '@master/css.react/CSSProvider'
import { config } from '../master.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <CSSProvider config={config}>
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </CSSProvider>
    </React.StrictMode>,
)
