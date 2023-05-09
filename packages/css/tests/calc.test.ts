import { testCSS } from './css'

it('calc', () => {
    testCSS('pt:calc($(h)|/|$(w)*100%)', '.pt\\:calc\\(\\$\\(h\\)\\|\\/\\|\\$\\(w\\)\\*100\\%\\){padding-top:calc(var(--h) / var(--w) * 100%)}')
    testCSS('pt:calc($(h)/$(w)*100%)', '.pt\\:calc\\(\\$\\(h\\)\\/\\$\\(w\\)\\*100\\%\\){padding-top:calc(var(--h) / var(--w) * 100%)}')
    testCSS('pt:calc(var(--h)/$(w)*100%)', '.pt\\:calc\\(var\\(--h\\)\\/\\$\\(w\\)\\*100\\%\\){padding-top:calc(var(--h) / var(--w) * 100%)}')
    testCSS('pt:calc($(h)/var(--w)*100%)', '.pt\\:calc\\(\\$\\(h\\)\\/var\\(--w\\)\\*100\\%\\){padding-top:calc(var(--h) / var(--w) * 100%)}')
    testCSS('pt:calc(var(--h)|/|$(w)*100%)', '.pt\\:calc\\(var\\(--h\\)\\|\\/\\|\\$\\(w\\)\\*100\\%\\){padding-top:calc(var(--h) / var(--w) * 100%)}')
    testCSS('pt:calc($(h)|/|var(--w)*100%)', '.pt\\:calc\\(\\$\\(h\\)\\|\\/\\|var\\(--w\\)\\*100\\%\\){padding-top:calc(var(--h) / var(--w) * 100%)}')
})