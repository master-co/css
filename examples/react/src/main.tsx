import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

/* ahead-of-time */
// import 'master.css'
// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
//     <React.StrictMode>
//         <App />
//     </React.StrictMode>,
// )

/* just-in-time */
// import { CSSProvider, ThemeProvider } from '@master/css.react'
// import { config } from '../master.css'
// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
//     <React.StrictMode>
//         <CSSProvider config={config}>
//             <ThemeProvider>
//                 <App />
//             </ThemeProvider>
//         </CSSProvider>
//     </React.StrictMode>,
// )

/* lazy loading just-in-time */
import { CSSLazyProvider, ThemeProvider } from '@master/css.react'
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <CSSLazyProvider config={import('../master.css')}>
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </CSSLazyProvider>
    </React.StrictMode>,
)
