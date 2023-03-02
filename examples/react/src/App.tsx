import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import ThemeSelect from './components/ThemeSelect'
import { useTheme } from '@master/css.react'

function App() {
    const [count, setCount] = useState(0)
    const theme = useTheme()

    return (
        <div className="App">
            <div>
                <a href="https://vitejs.dev" target="_blank">
                    <img src="/vite.svg" className="logo" alt="Vite logo" />
                </a>
                <a href="https://reactjs.org" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
            </div>
            <h1 className="italic font:extrabold">
                Vite + React
                + <span className='fg:primary fg:yellow-80@dark'>Master CSS</span>
            </h1>
            <div className="card">
                <button className="h:40 bg:gray-20@dark bg:slate-90@light" onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <button className="h:40 bg:gray-20@dark bg:slate-90@light ml:10 rel">
                    {theme.current === 'dark' ? '🌜' : '☀️'} {theme.current}
                    <ThemeSelect className="abs full inset:0 r:inherit opacity:0 font:inherit" />
                </button>
                <p>
                    Edit <code>src/App.jsx</code> and save to test HMR
                </p>
            </div>
            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
        </div>
    )
}

export default App
