import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeServiceProvider } from '@master/css.react'
import { lazy } from 'react'

const CSSProvider = lazy(() => import('@master/css.react/CSSProvider'))

ReactDOM.hydrateRoot(
    document.getElementById('root'),
    <CSSProvider config={import('../master.css')}>
        <ThemeServiceProvider options={{ default: 'system' }}>
            <App />
        </ThemeServiceProvider>
    </CSSProvider>,
)
