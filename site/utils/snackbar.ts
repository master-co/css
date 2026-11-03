import clsx from 'clsx'

export async function snackbar(text: string, { placement }: any = {}) {
    const element = document.createElement('div')
    element.className = clsx(
        'fixed z:1060 left:0 right:0 w:fit m:auto p:14|16 f:14 bg:gray-26@dark bg:white r:5 cursor:pointer',
        {
            'top:20': placement === 'top',
            'bottom:20': !placement
        }
    )
    element.style.boxShadow = `0px 0.2px 0.6px rgba(0, 0, 0, 0.015), 0px 0.5px 1.3px rgba(0, 0, 0, 0.022), 0px 1px 2.3px rgba(0, 0, 0, 0.028), 0px 1.6px 3.9px rgba(0, 0, 0, 0.032), 0px 2.6px 6.3px rgba(0, 0, 0, 0.038), 0px 4.6px 11.1px rgba(0, 0, 0, 0.045), 0px 10px 24px rgba(0, 0, 0, 0.06)`
    element.innerHTML = text
    document.body.appendChild(element)
    let closed = false
    const close = async () => {
        if (closed) return
        closed = true
        await element.animate([
            { opacity: 1 },
            { opacity: 0 }
        ], { duration: 100 }).finished
        element.remove()
    }
    element.onclick = close
    await element.animate([
        { transform: 'translateY(100%) scale(0)', opacity: 0 },
        { transform: 'translateY(0%) scale(1)', opacity: 1 }
    ], {
        duration: 200,
        easing: 'ease'
    }).finished
    setTimeout(close, 3000)
}