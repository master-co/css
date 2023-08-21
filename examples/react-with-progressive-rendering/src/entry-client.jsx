import ReactDOM from 'react-dom/client'
import App from './App'
import { lazy } from 'react'
import { ThemeServiceProvider, CSSProvider } from '@master/css.react'

ReactDOM.hydrateRoot(
    document.getElementById('root'),
    <CSSProvider config={import('../master.css')}>
        <ThemeServiceProvider options={{ default: 'system' }}>
            <App />
        </ThemeServiceProvider>
    </CSSProvider>,
)
