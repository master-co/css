import ReactDOM from 'react-dom/client'
import App from './App'
import { lazy } from 'react'
import { ThemeServiceProvider, CSSRuntimeProvider } from '@master/css.react'

ReactDOM.hydrateRoot(
    document.getElementById('root'),
    <CSSRuntimeProvider config={import('../master.css')}>
        <ThemeServiceProvider options={{ default: 'system' }}>
            <App />
        </ThemeServiceProvider>
    </CSSRuntimeProvider>,
)
