import './reports.css'

const states = { idle: 'report-idle', ready: 'report-ready' }
const report = document.querySelector('#report')
document.querySelector('#refresh').addEventListener('click', () => {
  report.classList.replace(states.idle, states.ready)
  report.dataset.state = 'ready'
  report.textContent = 'Report ready'
})
