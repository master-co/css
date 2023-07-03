import ReactDOMServer from 'react-dom/server'
import App from './App'

export function render() {
    return ReactDOMServer.renderToString(
        <App />
    )
}
