import MasterCSS from '@master/css'
import config from '../master.css'

new MasterCSS({ config })

const h1 = document.querySelector('h1')

h1
    .classList
    .add('text:underline')

document.getElementById('test').onclick = () => {
    h1.classList.add('mt:35')
    h1.classList.remove('mt:35')
    h1.style.fontWeight = 'bold'
    console.log(MasterCSS.root.countOfClass)
}