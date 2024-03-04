import { useState } from 'react'
import reactLogo from './assets/react.svg'
import masterLogo from './assets/master.svg'

function App() {
    const [count, setCount] = useState(0)
    return (
        <>
            <div className='grid-cols:2 w:fit mx:auto'>
                <a href="https://rc.css.master.co" target="_blank">
                    <img src={masterLogo} className="logo master scale(2)" alt="Master logo" />
                </a>
                <a href="https://reactjs.org" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
            </div>
            <h1 className="font:sans ls:-.25 fg:white@dark font:heavy">
                <span>Master CSS</span> <span className="fg:#00D8FF">React</span>
            </h1>
            <div className="card">
                <button className="h:40 bg:gray-80" onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
            </div>
            <p className="read-the-docs">
                Click on the React and Master CSS logos to learn more
            </p>
        </>
    )
}

export default App
