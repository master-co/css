import ReactDOM from 'react-dom/client'
import App from './App'
import { lazy } from 'react'

const CSSProvider = lazy(() => import('@master/css.react/CSSProvider'))
const ThemeServiceProvider = lazy(() => import('@master/css.react/ThemeServiceProvider'))

ReactDOM.hydrateRoot(
    document.getElementById('root'),
    <CSSProvider config={import('../master.css')}>
        <ThemeServiceProvider options={{ default: 'system' }}>
            <App />
        </ThemeServiceProvider>
    </CSSProvider>,
)
