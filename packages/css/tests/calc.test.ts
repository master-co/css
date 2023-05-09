import { testCSS } from './css'

it('calc', () => {
    testCSS('pt:calc($(h)|/|$(w)*100%)', '.pt\\:calc\\(\\$\\(h\\)\\|\\/\\|\\$\\(w\\)\\*100\\%\\){padding-top:calc(var(--h)/var(--w)*100%)}')
})