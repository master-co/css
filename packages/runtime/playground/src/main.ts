import '../../src/global.min'

const p1 = document.getElementById('p1') as HTMLHeadElement

const create = (name: string) => {
    const el = document.createElement('div')
    el.id = name
    el.className = name
    return el
}

const p1c1 = create('p1c1')
const p1c2 = document.getElementById('p1c2') as HTMLHeadElement
const p1c3 = document.getElementById('p1c3') as HTMLHeadElement

p1.remove()
p1.appendChild(p1c1)
p1c2.remove()
p1.appendChild(p1c2)
p1c2.classList.add('p1c2-1')
p1c3.remove()
p1c3.classList.add('p1c3-1')
document.body.appendChild(p1)
