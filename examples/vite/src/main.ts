import './style.css'
import 'master.css'
import { setupCounter } from './counter'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div class="flex center-content">
        <a href="https://vitejs.dev" target="_blank">
        <img src="/vite.svg" class="logo" alt="Vite logo" />
        </a>
        <a href="https://css.master.co" target="_blank">
        <img src="/master.svg" class="logo 172x172" alt="Master logo" />
        </a>
    </div>
    <h1>Vite v4 + Master CSS v2</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and Master CSS logos to learn more
    </p>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
