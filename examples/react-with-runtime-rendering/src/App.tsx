import { useState } from 'react'
import reactLogo from './assets/react.svg'
import masterLogo from './assets/master.svg'
import './App.css'
import ThemeSelect from './components/ThemeSelect'
import { useThemeService } from '@master/css.react'

function App() {
    const [count, setCount] = useState(0)
    const themeService = useThemeService()
    return (
        <div className="App">
            <div className='grid-cols:2 w:fit mx:auto'>
                <a href="https://reactjs.org" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
                <a href="https://css.master.co" target="_blank">
                    <img src={masterLogo} className="logo master scale(1.6)" alt="Master logo" />
                </a>
            </div>
            <h1 className="font:heavy ls:-.25 overflow:hover flex:focus">
                React + <span className='fg:primary fg:yellow-80@dark'>Master CSS</span>
            </h1>
            <div className="card">
                <button className="h:40 bg:gray-20@dark bg:slate-90@light" onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <button className="h:40 bg:gray-20@dark bg:slate-90@light ml:10 rel">
                    {themeService?.current === 'dark' ? '🌜' : '☀️'} {themeService?.current}
                    <ThemeSelect className="abs full inset:0 r:inherit opacity:0 font:inherit" />
                </button>
                <p className='mt:30'>
                    Edit <code className='font:mono'>src/App.jsx</code> and save to test HMR
                </p>
            </div>
            <p className="read-the-docs">
                Click on the React and Master CSS logos to learn more
            </p>
        </div>
    )
}

export default App
