import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ThemeServiceProvider, CSSProvider } from '@master/css.react'
import config from '../master.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <CSSProvider config={config}>
            <ThemeServiceProvider options={{ default: 'system' }}>
                <App />
            </ThemeServiceProvider>
        </CSSProvider>
    </React.StrictMode>,
)
